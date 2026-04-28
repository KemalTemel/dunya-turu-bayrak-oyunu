class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Load settings from localStorage or default to true
        this.sfxEnabled = localStorage.getItem('sfxEnabled') !== 'false';
        this.musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
        
        this.bgMusic = document.getElementById('bg-music');
        if (this.bgMusic) {
            this.bgMusic.volume = 0.3; // Soft background music
        }
    }

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        localStorage.setItem('sfxEnabled', this.sfxEnabled);
        return this.sfxEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('musicEnabled', this.musicEnabled);
        if (this.musicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        return this.musicEnabled;
    }

    playCorrect() {
        if (!this.sfxEnabled) return;
        this.beep(523.25, 0.1, 'sine', 0.05); // Soft C5
        setTimeout(() => this.beep(659.25, 0.15, 'sine', 0.05), 100); // Soft E5
        setTimeout(() => this.beep(783.99, 0.2, 'sine', 0.05), 200); // Soft G5
    }

    playWrong() {
        if (!this.sfxEnabled) return;
        this.beep(300, 0.15, 'triangle', 0.05);
        setTimeout(() => this.beep(250, 0.3, 'triangle', 0.05), 100);
        this.vibrate();
    }

    playClick() {
        if (!this.sfxEnabled) return;
        this.beep(600, 0.05, 'sine', 0.02); // Very soft subtle click
    }

    vibrate() {
        if (navigator.vibrate) {
            navigator.vibrate(100); // Shorter vibration
        }
    }

    startMusic() {
        if (!this.musicEnabled || !this.bgMusic) return;
        
        // Ensure audio context is active if we need it for future
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        // Play the audio tag
        this.bgMusic.play().catch(e => console.log("Auto-play prevented until user interaction."));
    }

    stopMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
        }
    }

    beep(freq, duration, type, volume = 0.1) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
}

export const audioManager = new AudioManager();
