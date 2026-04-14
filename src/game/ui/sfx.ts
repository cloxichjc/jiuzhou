import Phaser from 'phaser';

type Tone = { frequency: number; durationMs: number; gain: number; type?: OscillatorType };

export function playUiClick(scene: Phaser.Scene): void {
  playSequence(scene, [
    { frequency: 460, durationMs: 50, gain: 0.02, type: 'triangle' },
    { frequency: 620, durationMs: 60, gain: 0.018, type: 'triangle' },
  ]);
}

export function playDeploy(scene: Phaser.Scene): void {
  playSequence(scene, [
    { frequency: 240, durationMs: 50, gain: 0.028, type: 'square' },
    { frequency: 320, durationMs: 70, gain: 0.024, type: 'triangle' },
  ]);
}

export function playHit(scene: Phaser.Scene, strong = false): void {
  playSequence(scene, [
    { frequency: strong ? 180 : 220, durationMs: 45, gain: strong ? 0.035 : 0.02, type: 'sawtooth' },
  ]);
}

export function playVictory(scene: Phaser.Scene): void {
  playSequence(scene, [
    { frequency: 440, durationMs: 80, gain: 0.024, type: 'triangle' },
    { frequency: 554, durationMs: 80, gain: 0.024, type: 'triangle' },
    { frequency: 659, durationMs: 120, gain: 0.028, type: 'triangle' },
  ]);
}

export function playDefeat(scene: Phaser.Scene): void {
  playSequence(scene, [
    { frequency: 320, durationMs: 100, gain: 0.022, type: 'sine' },
    { frequency: 240, durationMs: 120, gain: 0.022, type: 'sine' },
    { frequency: 180, durationMs: 140, gain: 0.026, type: 'sine' },
  ]);
}

function playSequence(scene: Phaser.Scene, tones: Tone[]): void {
  const context = getAudioContext(scene);
  if (!context) {
    return;
  }

  let cursor = context.currentTime;
  tones.forEach((tone) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = tone.type ?? 'triangle';
    oscillator.frequency.setValueAtTime(tone.frequency, cursor);
    gain.gain.setValueAtTime(tone.gain, cursor);
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + tone.durationMs / 1000);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(cursor);
    oscillator.stop(cursor + tone.durationMs / 1000);
    cursor += tone.durationMs / 1000;
  });
}

function getAudioContext(scene: Phaser.Scene): AudioContext | undefined {
  const soundManager = scene.sound as unknown as { context?: AudioContext };
  if (soundManager?.context) {
    return soundManager.context;
  }
  const audioContextCtor = globalThis.AudioContext ?? (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return audioContextCtor ? new audioContextCtor() : undefined;
}
