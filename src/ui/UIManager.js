import { game } from '../core/Game.js';
import { progression } from '../systems/Progression.js';
import { localization } from '../systems/Localization.js';
import { audioManager } from '../core/AudioManager.js';
import { supabaseService } from '../systems/SupabaseService.js';


class UIManager {
    constructor() {
        this.screens = document.querySelectorAll('.screen');
        this.initElements();
        this.initEvents();
    }

    initElements() {
        // Stats
        this.livesEl = document.getElementById('lives-count');
        this.goldEl = document.getElementById('gold-count');
        this.scoreEl = document.getElementById('score-count');
        this.opponentEl = document.getElementById('opponent-score'); // New
        this.levelEl = document.getElementById('current-level');
        this.timerBar = document.getElementById('game-timer');
        this.userWelcomeEl = document.getElementById('user-welcome');

        // Login elements
        this.loginScreen = document.getElementById('login-screen');
        this.loginInput = document.getElementById('login-username');
        this.btnLogin = document.getElementById('btn-login');
        this.loginStatus = document.getElementById('login-status');

        // Game components
        this.flagImg = document.getElementById('current-flag');
        this.optionsGrid = document.getElementById('options-container');
        this.typingContainer = document.getElementById('typing-input-container');
        this.typingInput = document.getElementById('country-input');
        
        // Buttons
        this.btnStart = document.getElementById('btn-start');
        this.overlay = document.getElementById('overlay-container');
    }

    initEvents() {
        this.btnLogin.addEventListener('click', () => this.handleLogin());
        this.loginInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        this.btnStart.addEventListener('click', () => {
            audioManager.playClick();
            audioManager.startMusic();
            this.showScreen('game-screen');
            game.start('classic');
            this.updateHUD();
            this.renderQuestion(game.nextQuestion());
        });

        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                audioManager.playClick();
                const mode = card.getAttribute('data-mode');
                this.showScreen('game-screen');
                game.start(mode);
                this.updateHUD();
                this.renderQuestion(game.nextQuestion());
            });
        });

        document.getElementById('btn-world-tour').addEventListener('click', () => {
            audioManager.playClick();
            this.showScreen('world-tour-screen');
            this.updateWorldTour();
        });

        document.getElementById('btn-back-tour').addEventListener('click', () => {
            audioManager.playClick();
            this.showScreen('main-menu');
        });

        document.getElementById('btn-back-game').addEventListener('click', () => {
            audioManager.playClick();
            game.stopTimer();
            game.isGameOver = true;
            this.showScreen('main-menu');
        });

        document.querySelectorAll('.btn-play-region').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.disabled) return;
                audioManager.playClick();
                audioManager.startMusic();
                const region = btn.closest('.region-card').dataset.region;
                this.showScreen('game-screen');
                game.start('world-tour', region);
                this.updateHUD();
                this.renderQuestion(game.nextQuestion());
            });
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            audioManager.playClick();
            this.showOverlay('tpl-settings');
        });

        document.getElementById('btn-leaderboard').addEventListener('click', () => {
            audioManager.playClick();
            this.showOverlay('tpl-leaderboard');
            this.renderLeaderboard();
        });

        document.getElementById('btn-submit-typing').addEventListener('click', () => {
            this.handleTypingSubmit();
        });

        this.typingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleTypingSubmit();
        });

        // Hints
        document.getElementById('hint-50-50').addEventListener('click', () => this.useHint('50-50'));
        document.getElementById('hint-letter').addEventListener('click', () => this.useHint('letter'));
        document.getElementById('hint-capital').addEventListener('click', () => this.useHint('capital'));

        // Game callbacks
        game.onTimerUpdate = (remaining, total) => {
            const percent = (remaining / total) * 100;
            this.timerBar.style.width = `${percent}%`;
            if (percent < 30) this.timerBar.style.background = 'var(--danger)';
            else this.timerBar.style.background = 'var(--primary)';
        };

        game.onOpponentUpdate = (score) => {
            if (this.opponentEl) this.opponentEl.textContent = score;
        };

        game.onScoreUpdate = (score) => {
            this.scoreEl.textContent = score;
        };

        game.onTimeout = () => {
            this.showFeedback(false);
            setTimeout(() => {
                this.updateHUD();
                this.renderQuestion(game.nextQuestion());
            }, 1000);
        };

        game.onGameOver = () => this.showGameOver();
    }

    async handleLogin() {
        const username = this.loginInput.value.trim();
        if (!username) return;

        audioManager.playClick();
        audioManager.startMusic();

        this.btnLogin.disabled = true;
        this.loginStatus.textContent = localization.translate('Giriş yapılıyor...');

        try {
            let { data, error } = await supabaseService.getProfile(username);

            if (error && error.code !== 'PGRST116') { // PGRST116 means not found
                throw error;
            }

            if (!data) {
                // Create new profile
                const result = await supabaseService.createProfile(username);
                data = result.data;
                if (result.error) throw result.error;
            }

            // Sync local progression with cloud data
            progression.playerName = username;
            progression.gold = data.gold || 100;
            progression.highScore = data.high_score || 0;
            progression.save();

            this.userWelcomeEl.textContent = `HOŞGELDİN, ${username.toUpperCase()}!`;
            
            // Go to loading then menu
            this.showScreen('loading-screen');
            
            // Animate progress bar during login transition
            const progress = document.getElementById('loading-progress');
            let w = 0;
            const interval = setInterval(() => {
                w += 5;
                if (progress) progress.style.width = w + '%';
                if (w >= 100) {
                    clearInterval(interval);
                    setTimeout(() => this.showScreen('main-menu'), 500);
                }
            }, 50);

        } catch (err) {
            console.error(err);
            this.loginStatus.textContent = 'Hata oluştu, tekrar deneyin.';
            this.btnLogin.disabled = false;
        }
    }

    showScreen(id) {
        // First, hide all screens with a quick fade-out
        this.screens.forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        // Then show the target screen
        const target = document.getElementById(id);
        target.style.display = 'flex';
        // Small timeout to ensure display:flex is applied before adding .active (for transition)
        setTimeout(() => target.classList.add('active'), 10);
    }

    showOverlay(templateId) {
        const template = document.getElementById(templateId);
        const content = template.content.cloneNode(true);
        this.overlay.innerHTML = '';
        this.overlay.appendChild(content);
        this.overlay.classList.remove('hidden');

        // Bind close buttons
        const closeBtn = this.overlay.querySelector('.btn-primary');
        if (closeBtn) closeBtn.onclick = () => this.overlay.classList.add('hidden');

        // Bind settings toggles if applicable
        const sfxToggle = this.overlay.querySelector('#toggle-sfx');
        if (sfxToggle) {
            sfxToggle.textContent = audioManager.sfxEnabled ? 'AÇIK' : 'KAPALI';
            sfxToggle.onclick = () => {
                const enabled = audioManager.toggleSfx();
                sfxToggle.textContent = enabled ? 'AÇIK' : 'KAPALI';
            };
        }

        const musicToggle = this.overlay.querySelector('#toggle-music');
        if (musicToggle) {
            musicToggle.textContent = audioManager.musicEnabled ? 'AÇIK' : 'KAPALI';
            musicToggle.onclick = () => {
                const enabled = audioManager.toggleMusic();
                musicToggle.textContent = enabled ? 'AÇIK' : 'KAPALI';
            };
        }

        const langToggle = this.overlay.querySelector('#toggle-lang');
        if (langToggle) {
            langToggle.textContent = localization.currentLang === 'tr' ? 'TÜRKÇE' : 'ENGLISH';
            langToggle.onclick = () => {
                const next = localization.currentLang === 'tr' ? 'en' : 'tr';
                localization.setLanguage(next);
                langToggle.textContent = next === 'tr' ? 'TÜRKÇE' : 'ENGLISH';
                localization.updateUI(); // Ensure all elements are updated
            };
        }
    }

    updateWorldTour() {
        const regions = ['Europe', 'Asia', 'Americas', 'Africa'];
        regions.forEach(r => {
            const card = document.querySelector(`.region-card[data-region="${r}"]`);
            if (card) {
                const bar = card.querySelector('.bar');
                const progress = r === 'Europe' ? 35 : 0;
                bar.style.width = `${progress}%`;

                // Add country dots if not already there
                if (!card.querySelector('.country-dots')) {
                    const dots = document.createElement('div');
                    dots.className = 'country-dots';
                    for (let i = 0; i < 10; i++) {
                        const dot = document.createElement('span');
                        dot.className = 'dot' + (i < (progress/10) ? ' completed' : '');
                        dots.appendChild(dot);
                    }
                    card.insertBefore(dots, card.querySelector('.btn-play-region'));
                }
            }
        });
    }

    async renderLeaderboard() {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '<p>Yükleniyor...</p>';
        
        const topScores = await supabaseService.getTopScores();

        list.innerHTML = topScores.map((u, i) => `
            <div class="leader-item">
                <span><span class="rank">#${i+1}</span> ${u.name}</span>
                <span>${u.score}</span>
            </div>
        `).join('');
    }

    updateHUD() {
        this.livesEl.textContent = progression.lives;
        this.goldEl.textContent = progression.gold;
        this.scoreEl.textContent = progression.score;
        this.levelEl.textContent = progression.level;
    }

    renderQuestion(data) {
        if (!data) return;

        // Boss Level Visuals
        if (game.isBossLevel) {
            document.getElementById('game-screen').style.background = 'rgba(231, 76, 60, 0.2)';
            this.levelEl.style.color = 'var(--danger)';
            this.levelEl.textContent = 'BOSS LEVEL!';
        } else {
            document.getElementById('game-screen').style.background = 'transparent';
            this.levelEl.style.color = 'var(--accent)';
            this.levelEl.textContent = progression.level;
        }

        this.flagImg.src = `https://flagcdn.com/w320/${data.country.code}.png`;
        this.optionsGrid.innerHTML = '';
        this.typingInput.value = '';

        if (data.mode === 'typing') {
            this.optionsGrid.classList.add('hidden');
            this.typingContainer.classList.remove('hidden');
            this.typingInput.focus();
        } else {
            this.optionsGrid.classList.remove('hidden');
            this.typingContainer.classList.add('hidden');

            data.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = opt.name[localization.currentLang];
                btn.addEventListener('click', () => this.handleOptionClick(opt, btn));
                this.optionsGrid.appendChild(btn);
            });
        }
    }

    handleOptionClick(option, btn) {
        const result = game.checkAnswer(option);
        if (result.correct) {
            btn.classList.add('correct');
            this.showFeedback(true);
        } else {
            btn.classList.add('wrong');
            this.showFeedback(false);
        }

        setTimeout(() => {
            this.updateHUD();
            if (result.gameOver) {
                this.showGameOver();
            } else {
                this.renderQuestion(game.nextQuestion());
            }
        }, 1000);
    }

    handleTypingSubmit() {
        const val = this.typingInput.value;
        const result = game.checkAnswer(val);
        
        if (result.correct) {
            this.typingInput.style.borderColor = 'var(--success)';
            this.showFeedback(true);
        } else {
            this.typingInput.style.borderColor = 'var(--danger)';
            this.showFeedback(false);
        }

        setTimeout(() => {
            this.typingInput.style.borderColor = 'var(--glass-border)';
            this.updateHUD();
            if (result.gameOver) {
                this.showGameOver();
            } else {
                this.renderQuestion(game.nextQuestion());
            }
        }, 1000);
    }

    showFeedback(isCorrect) {
        // Simple visual feedback could be added here
    }

    showGameOver() {
        try {
            const isNewRecord = progression.score > progression.highScore;
            progression.save(); // Save locally first
            game.stopTimer(); // Ensure everything is stopped

            // Sync with Supabase if logged in
            if (progression.playerName) {
                supabaseService.updateProfile(progression.playerName, {
                    high_score: progression.highScore,
                    gold: progression.gold
                }).catch(e => console.error("Cloud sync error:", e));

                // Auto-save high score if it's a new record
                if (isNewRecord) {
                    supabaseService.saveScore(progression.playerName, progression.score, localization.currentLang)
                        .catch(e => console.error("Auto-save score error:", e));
                }
            }

            this.overlay.classList.remove('hidden');
            
            this.overlay.innerHTML = `
                <div class="modal">
                    <h2>${isNewRecord ? '🎉 YENİ REKOR! 🎉' : localization.translate('Game Over')}</h2>
                    <p>${localization.translate('Score')}: ${progression.score}</p>
                    
                    <div class="badges-row">
                        ${progression.badges.map(b => `<span class="badge-icon" title="${b}">🏅</span>`).join('')}
                    </div>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <button class="btn-primary" id="btn-restart">Oyunu Bitir ve Tekrar Oyna</button>
                        <button class="btn-secondary" id="btn-ad-life">📺 +1 Can (Reklam)</button>
                        <button class="btn-secondary" id="btn-gold-life">💰 +1 Can (100 Altın)</button>
                        <button class="btn-secondary" id="btn-home">Sadece Oyunu Bitir</button>
                    </div>
                </div>
            `;

            // Bind Events Safely
            const btnRestart = document.getElementById('btn-restart');
            if (btnRestart) {
                btnRestart.onclick = () => {
                    this.overlay.classList.add('hidden');
                    game.start(game.currentMode);
                    this.updateHUD();
                    this.renderQuestion(game.nextQuestion());
                };
            }

            const btnHome = document.getElementById('btn-home');
            if (btnHome) {
                btnHome.onclick = () => {
                    this.overlay.classList.add('hidden');
                    this.showScreen('main-menu');
                };
            }

            const btnGold = document.getElementById('btn-gold-life');
            if (btnGold) {
                btnGold.onclick = () => {
                    if (progression.spendGold(100)) {
                        progression.lives += 1;
                        game.isGameOver = false;
                        this.overlay.classList.add('hidden');
                        this.updateHUD();
                        game.startTimeTask();
                    } else {
                        alert('Yetersiz altın!');
                    }
                };
            }

            const btnAd = document.getElementById('btn-ad-life');
            if (btnAd) {
                const canWatch = progression.canWatchAd();
                btnAd.disabled = !canWatch;
                if (!canWatch) {
                    btnAd.textContent = '🚫 Bu Oyunluk Reklam Bitti';
                    btnAd.style.opacity = '0.5';
                } else {
                    btnAd.textContent = `📺 +1 Can (Bu Oyun İçin Kalan: ${3 - progression.adsWatchedInGame})`;
                }

                btnAd.onclick = () => {
                    this.handleWatchAd(btnAd);
                };
            }

        } catch (error) {
            console.error("Game Over UI Error:", error);
            // Emergency fallback
            this.overlay.innerHTML = '<div class="modal"><h2>Hata Oluştu</h2><button class="btn-primary" onclick="location.reload()">Sayfayı Yenile</button></div>';
        }
    }

    handleWatchAd(btn) {
        btn.disabled = true;
        btn.textContent = '📡 Reklam Yükleniyor...';

        // BURASI: Gerçek Google AdSense/AdMob kodu buraya gelecek
        // adsbygoogle.push({}) gibi...
        
        setTimeout(() => {
            alert(localization.translate('Extra Life Earned!'));
            progression.lives += 1;
            progression.incrementAdsWatched();
            game.isGameOver = false;
            this.overlay.classList.add('hidden');
            this.updateHUD();
            game.startTimeTask();
        }, 2500); // 2.5 saniyelik simülasyon
    }

    useHint(type) {
        const result = game.useHint(type);
        if (result) {
            this.updateHUD();
            if (type === '50-50') {
                const buttons = Array.from(this.optionsGrid.children);
                let removed = 0;
                buttons.forEach(btn => {
                    if (removed < 2 && btn.textContent !== game.currentQuestion.name[localization.currentLang]) {
                        btn.style.opacity = '0.3';
                        btn.disabled = true;
                        removed++;
                    }
                });
            } else {
                alert(`${localization.translate('Hint')}: ${result}`);
            }
        } else {
            alert('Yetersiz altın!');
        }
    }
}

export const uiManager = new UIManager();
