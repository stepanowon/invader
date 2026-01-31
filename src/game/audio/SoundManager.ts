/**
 * Space Invaders 사운드 매니저
 * Web Audio API를 사용하여 8비트 스타일 효과음 생성
 */
export class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 0.3;
  private enabled: boolean = true;

  private constructor() {
    this.initAudioContext();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  private ensureContext(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 플레이어 발사음
   */
  playShoot(): void {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * 적 폭발음
   */
  playEnemyExplosion(): void {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    this.createNoise(0.15);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.15);

    gain.gain.setValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  /**
   * 플레이어 피격/폭발음
   */
  playPlayerExplosion(): void {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    // 긴 폭발음
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.audioContext.destination);

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.5);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.5);

    gain.gain.setValueAtTime(this.masterVolume * 0.5, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    osc1.start(this.audioContext.currentTime);
    osc2.start(this.audioContext.currentTime);
    osc1.stop(this.audioContext.currentTime + 0.5);
    osc2.stop(this.audioContext.currentTime + 0.5);
  }

  /**
   * UFO 비행음 (연속 재생용)
   */
  private ufoOscillator: OscillatorNode | null = null;
  private ufoGain: GainNode | null = null;

  startUFOSound(): void {
    if (!this.enabled || !this.audioContext || this.ufoOscillator) return;
    this.ensureContext();

    this.ufoOscillator = this.audioContext.createOscillator();
    this.ufoGain = this.audioContext.createGain();

    this.ufoOscillator.connect(this.ufoGain);
    this.ufoGain.connect(this.audioContext.destination);

    this.ufoOscillator.type = 'sine';
    this.ufoOscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);

    // LFO로 워블 효과
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.connect(lfoGain);
    lfoGain.connect(this.ufoOscillator.frequency);
    lfo.frequency.setValueAtTime(8, this.audioContext.currentTime);
    lfoGain.gain.setValueAtTime(100, this.audioContext.currentTime);
    lfo.start(this.audioContext.currentTime);

    this.ufoGain.gain.setValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime);

    this.ufoOscillator.start(this.audioContext.currentTime);
  }

  stopUFOSound(): void {
    if (this.ufoOscillator) {
      this.ufoOscillator.stop();
      this.ufoOscillator = null;
      this.ufoGain = null;
    }
  }

  /**
   * UFO 폭발음
   */
  playUFOExplosion(): void {
    this.stopUFOSound();
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);

    gain.gain.setValueAtTime(this.masterVolume * 0.5, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.3);
  }

  /**
   * 적 이동음 (4가지 음 순환)
   */
  private invaderSoundIndex: number = 0;
  private readonly invaderFrequencies: number[] = [80, 90, 100, 90];

  playInvaderMove(): void {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.type = 'square';
    const freq = this.invaderFrequencies[this.invaderSoundIndex];
    osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

    gain.gain.setValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.05);

    this.invaderSoundIndex = (this.invaderSoundIndex + 1) % 4;
  }

  /**
   * 스테이지 시작 팡파레
   */
  playStageStart(): void {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    const duration = 0.15;

    notes.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext!.destination);

      osc.type = 'square';
      const startTime = this.audioContext!.currentTime + index * duration;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * 스테이지 클리어 효과음
   */
  playStageClear(): void {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    const notes = [523, 659, 784, 1047, 784, 1047]; // 승리 멜로디
    const durations = [0.1, 0.1, 0.1, 0.2, 0.1, 0.3];

    let time = this.audioContext.currentTime;
    notes.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext!.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(this.masterVolume * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + durations[index]);

      osc.start(time);
      osc.stop(time + durations[index]);

      time += durations[index];
    });
  }

  /**
   * 보너스 점수 효과음 (UFO 격추 시)
   */
  playBonusScore(): void {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    // 상승하는 아르페지오
    const notes = [440, 554, 659, 880]; // A4, C#5, E5, A5
    const duration = 0.08;

    notes.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext!.destination);

      osc.type = 'triangle';
      const startTime = this.audioContext!.currentTime + index * duration;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(this.masterVolume * 0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 1.5);

      osc.start(startTime);
      osc.stop(startTime + duration * 1.5);
    });
  }

  /**
   * 생명 잃을 때 경고음
   */
  playLifeLost(): void {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    // 하강하는 경고음
    const notes = [440, 330, 220]; // A4, E4, A3
    const duration = 0.2;

    notes.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext!.destination);

      osc.type = 'sawtooth';
      const startTime = this.audioContext!.currentTime + index * duration;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(this.masterVolume * 0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * 게임 오버 효과음
   */
  playGameOver(): void {
    if (!this.enabled || !this.audioContext) return;
    this.ensureContext();

    // 슬픈 하강 멜로디
    const notes = [392, 349, 330, 294, 262]; // G4, F4, E4, D4, C4
    const duration = 0.25;

    notes.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext!.destination);

      osc.type = 'triangle';
      const startTime = this.audioContext!.currentTime + index * duration;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(this.masterVolume * 0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 0.9);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * 사운드 활성화 상태 반환
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 현재 볼륨 반환
   */
  getVolume(): number {
    return this.masterVolume;
  }

  /**
   * 노이즈 생성 (폭발음용)
   */
  private createNoise(duration: number): AudioBufferSourceNode | null {
    if (!this.audioContext) return null;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();

    noise.buffer = buffer;
    noise.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);

    noiseGain.gain.setValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    noise.start(this.audioContext.currentTime);

    return noise;
  }
}
