export class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.isMuted = false;
    }

    setMuted(muted) {
        this.isMuted = muted;
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (this.isMuted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playSpawn() {
        // Soft pop
        this.playTone(300, 'sine', 0.1, 0.1);
    }

    playMove() {
        // Swift whoosh
        this.playTone(400, 'triangle', 0.1, 0.05);
    }

    playClear() {
        // High pleasant ding
        this.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.2, 0.1), 100);
    }

    playGameOver() {
        // Sad melody
        this.playTone(300, 'sawtooth', 0.3, 0.1);
        setTimeout(() => this.playTone(250, 'sawtooth', 0.3, 0.1), 300);
        setTimeout(() => this.playTone(200, 'sawtooth', 0.5, 0.1), 600);
    }

    playClick() {
        this.playTone(800, 'sine', 0.05, 0.05);
    }
}
