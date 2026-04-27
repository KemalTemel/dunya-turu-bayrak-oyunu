class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
        this.musicEnabled = true;
        this.musicInterval = null;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) this.startMusic();
        else this.stopMusic();
        return this.musicEnabled;
    }

    playCorrect() {
        if (!this.enabled) return;
        this.beep(660, 0.1, 'sine');
        setTimeout(() => this.beep(880, 0.1, 'sine'), 100);
    }

    playWrong() {
        if (!this.enabled) return;
        this.beep(220, 0.2, 'sawtooth');
        this.vibrate();
    }

    playClick() {
        if (!this.enabled) return;
        this.beep(440, 0.05, 'triangle');
    }

    vibrate() {
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
    }

    startMusic() {
        if (!this.musicEnabled || this.musicInterval) return;
        
        const melody = [440, 493.88, 523.25, 587.33]; // A4, B4, C5, D5
        let noteIdx = 0;

        this.musicInterval = setInterval(() => {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            this.beep(melody[noteIdx], 0.4, 'triangle', 0.03);
            noteIdx = (noteIdx + 1) % melody.length;
        }, 800);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }

    beep(freq, duration, type, volume = 0.1) {
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
