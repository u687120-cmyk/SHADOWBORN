/**
 * SHADOWBORN: AWAKENING - Procedural Audio Engine
 * Uses Web Audio API to synthesize dark fantasy supernatural sound effects.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playWhoosh() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playAuraPunchImpact() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        // Sub bass thump
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(160, now);
        subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

        subGain.gain.setValueAtTime(0.7, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.35);

        // Supernatural Energy Distortion (Sawtooth + High resonance bandpass)
        const energyOsc = this.ctx.createOscillator();
        const energyFilter = this.ctx.createBiquadFilter();
        const energyGain = this.ctx.createGain();

        energyOsc.type = 'sawtooth';
        energyOsc.frequency.setValueAtTime(420, now);
        energyOsc.frequency.exponentialRampToValueAtTime(90, now + 0.3);

        energyFilter.type = 'bandpass';
        energyFilter.frequency.setValueAtTime(700, now);
        energyFilter.Q.setValueAtTime(5.0, now);

        energyGain.gain.setValueAtTime(0.4, now);
        energyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        energyOsc.connect(energyFilter);
        energyFilter.connect(energyGain);
        energyGain.connect(this.ctx.destination);

        energyOsc.start(now);
        energyOsc.stop(now + 0.3);

        // Noise burst for physical crack
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1400, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.15);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        whiteNoise.start(now);
        whiteNoise.stop(now + 0.15);
    }

    playDemonRoar() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(65, now + 0.4);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    playVictory() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const chord = [220, 277.18, 329.63, 440]; // A Minor Major 7th dark triumphant chord

        chord.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.01, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + 1.8);
        });
    }
}

window.soundEngine = new SoundEngine();
