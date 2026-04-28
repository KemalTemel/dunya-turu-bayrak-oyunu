import { countries } from '../data/countries.js';
import { progression } from '../systems/Progression.js';
import { audioManager } from './AudioManager.js';
import { localization } from '../systems/Localization.js';

class Game {
    constructor() {
        this.currentMode = 'classic';
        this.currentQuestion = null;
        this.timer = null;
        this.timeRemaining = 0;
        this.maxTime = 15;
        this.isGameOver = false;
        this.usedCountries = [];
        this.isBossLevel = false;
        this.idleTimer = null;
        this.opponentScore = 0;
        this.opponentInterval = null;
    }

    start(mode = 'classic', region = null) {
        this.currentMode = mode;
        this.currentRegion = region;
        this.isGameOver = false;
        this.usedCountries = [];
        this.opponentScore = 0;
        progression.reset();
        this.startOpponentSim();
        this.nextQuestion();
    }

    nextQuestion() {
        if (this.isGameOver) return;

        // Reset timers
        this.stopTimer();
        this.resetIdleTimer();

        // Check for Boss Level
        this.isBossLevel = progression.level > 0 && progression.level % 10 === 0;
        let available = countries.filter(c => !this.usedCountries.includes(c.code));
        
        if (this.currentMode === 'world-tour' && this.currentRegion) {
            available = available.filter(c => c.region.includes(this.currentRegion));
        }

        if (available.length === 0) {
            this.usedCountries = []; // Reset if all countries used
            available = countries;
            if (this.currentMode === 'world-tour' && this.currentRegion) {
                available = available.filter(c => c.region.includes(this.currentRegion));
            }
        }
        
        const target = available[Math.floor(Math.random() * available.length)];
        this.currentQuestion = target;
        this.usedCountries.push(target.code);

        // Prepare options based on mode
        let options = [];
        if (this.currentMode !== 'typing') {
            options = this.generateOptions(target);
        }

        // Setup mode-specific constraints
        if (this.currentMode === 'timed' || this.currentMode === 'hard' || this.currentMode === 'typing') {
            this.startTimeTask();
        }

        return {
            country: target,
            options: options,
            mode: this.currentMode
        };
    }

    generateOptions(target) {
        let options = [target];
        let pool = [...countries].filter(c => c.code !== target.code);

        // In hard mode or boss level, try to pick countries from same region or similar flags
        if (this.currentMode === 'hard' || this.isBossLevel) {
            let similar = [];
            if (target.similarCodes) {
                similar = countries.filter(c => target.similarCodes.includes(c.code));
            }
            const sameRegion = pool.filter(c => c.region === target.region);
            pool = Array.from(new Set([...similar, ...sameRegion, ...pool]));
        }

        while (options.length < 4) {
            const index = Math.floor(Math.random() * pool.length);
            const selected = pool[index];
            if (!options.find(o => o.code === selected.code)) {
                options.push(selected);
            }
            pool.splice(index, 1);
        }

        return this.shuffle(options);
    }

    shuffle(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    checkAnswer(answer) {
        if (this.isGameOver) return;
        this.resetIdleTimer();

        let correct = false;
        if (typeof answer === 'string') {
            // For typing mode
            correct = answer.toLowerCase().trim() === this.currentQuestion.name[localization.currentLang].toLowerCase().trim() ||
                      answer.toLowerCase().trim() === this.currentQuestion.name.en.toLowerCase().trim();
        } else {
            // For choice mode
            correct = answer.code === this.currentQuestion.code;
        }

        if (correct) {
            audioManager.playCorrect();
            const speedBonus = this.timer ? (this.timeRemaining / this.maxTime) + 1 : 1;
            const bossMultiplier = this.isBossLevel ? 3 : 1;
            progression.addScore(100 * bossMultiplier, speedBonus);
            
            if (progression.correctCount % 10 === 0) {
                progression.nextLevel();
            }

            return { correct: true, next: true };
        } else {
            audioManager.playWrong();
            const lives = progression.loseLife();
            if (lives <= 0) {
                this.isGameOver = true;
                return { correct: false, gameOver: true };
            }
            return { correct: false, next: false };
        }
    }

    startTimeTask() {
        let baseTime = this.maxTime - (progression.level * 0.5);
        if (this.isBossLevel) baseTime *= 0.5; // Half time for boss
        this.timeRemaining = Math.max(3, baseTime);
        this.maxTimeCurrent = this.timeRemaining;
        
        this.timer = setInterval(() => {
            this.timeRemaining -= 0.1;
            if (this.timeRemaining <= 0) {
                this.stopTimer();
                this.handleTimeout();
            }
            if (this.onTimerUpdate) this.onTimerUpdate(this.timeRemaining, this.maxTimeCurrent);
        }, 100);

        this.startIdleTimer();
    }

    startIdleTimer() {
        this.resetIdleTimer();
        this.idleTimer = setInterval(() => {
            if (progression.score > 0) {
                progression.score -= 1;
                if (this.onScoreUpdate) this.onScoreUpdate(progression.score);
            }
        }, 5000); // Penalty every 5 seconds of inactivity
    }

    resetIdleTimer() {
        if (this.idleTimer) clearInterval(this.idleTimer);
    }

    startOpponentSim() {
        if (this.opponentInterval) clearInterval(this.opponentInterval);
        this.opponentInterval = setInterval(() => {
            if (this.isGameOver) return;
            // Opponent score increases randomly
            this.opponentScore += Math.floor(Math.random() * 50);
            if (this.onOpponentUpdate) this.onOpponentUpdate(this.opponentScore);
        }, 3000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.resetIdleTimer();
        this.stopOpponentSim();
    }

    stopOpponentSim() {
        if (this.opponentInterval) {
            clearInterval(this.opponentInterval);
            this.opponentInterval = null;
        }
    }

    handleTimeout() {
        const lives = progression.loseLife();
        if (lives <= 0) {
            this.isGameOver = true;
            if (this.onGameOver) this.onGameOver();
        } else {
            if (this.onTimeout) this.onTimeout();
        }
    }

    useHint(type) {
        if (type === '50-50') {
            if (progression.spendGold(50)) return true;
        } else if (type === 'letter') {
            if (progression.spendGold(30)) return this.currentQuestion.name[localization.currentLang][0];
        } else if (type === 'capital') {
            if (progression.spendGold(40)) return this.currentQuestion.capital[localization.currentLang];
        }
        return false;
    }
}

export const game = new Game();
