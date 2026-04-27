class Progression {
    constructor() {
        this.reset();
        this.achievements = {
            streak10: false,
            guess50: false,
            perfectRound: false
        };
        this.badges = [];
        this.playerName = null;
        this.adsWatchedInGame = 0;
    }

    reset() {
        this.lives = 5;
        this.gold = 100;
        this.score = 0;
        this.highScore = this.highScore || 0; // Keep current highscore
        this.level = 1;
        this.combo = 0;
        this.correctCount = 0;
        this.isPerfectRound = true;
        this.adsWatchedInGame = 0;
    }

    addScore(amount, speedBonus = 1) {
        const points = Math.floor(amount * speedBonus * (1 + this.combo * 0.1));
        this.score += points;
        this.gold += Math.floor(points / 10);
        this.combo++;
        this.correctCount++;
        this.checkAchievements();
        return points;
    }

    loseLife() {
        this.lives--;
        this.combo = 0;
        this.isPerfectRound = false;
        return this.lives;
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    addGold(amount) {
        this.gold += amount;
    }

    nextLevel() {
        this.level++;
        return this.level;
    }

    checkAchievements() {
        if (this.combo >= 10 && !this.achievements.streak10) {
            this.achievements.streak10 = true;
            this.addGold(50);
            return "10 Correct in a Row";
        }
        if (this.correctCount >= 50 && !this.achievements.guess50) {
            this.achievements.guess50 = true;
            this.addGold(100);
            this.badges.push("Explorer");
            return "Guess 50 Countries";
        }
        if (this.level > 1 && this.isPerfectRound && !this.achievements.perfectRound) {
            this.achievements.perfectRound = true;
            this.addGold(200);
            this.badges.push("Perfectionist");
            return "No Mistakes Round";
        }
        return null;
    }

    canWatchAd() {
        return this.adsWatchedInGame < 3;
    }

    incrementAdsWatched() {
        this.adsWatchedInGame++;
    }

    save() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        const data = {
            playerName: this.playerName,
            gold: this.gold,
            highScore: this.highScore,
            achievements: this.achievements,
            totalCorrect: this.correctCount,
            badges: this.badges
        };
        localStorage.setItem('flag_master_data', JSON.stringify(data));
    }

    load() {
        const data = localStorage.getItem('flag_master_data');
        if (data) {
            const parsed = JSON.parse(data);
            this.playerName = parsed.playerName || null;
            this.gold = parsed.gold || 100;
            this.highScore = parsed.highScore || 0;
            this.achievements = parsed.achievements || this.achievements;
            this.correctCount = parsed.totalCorrect || 0;
            this.badges = parsed.badges || [];
        }
    }
}

export const progression = new Progression();
