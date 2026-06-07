/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let isMuted = false;

export function toggleMuteSound(): boolean {
  isMuted = !isMuted;
  localStorage.setItem('sudoku_sound_muted', isMuted ? 'true' : 'false');
  return isMuted;
}

export function initializeMuteState(): boolean {
  const saved = localStorage.getItem('sudoku_sound_muted');
  isMuted = saved === 'true';
  return isMuted;
}

export function playMuted(): boolean {
  return isMuted;
}

// Helper to get or create AudioContext safely (browsers require user gesture)
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playClick(): void {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.warn('AudioContext failed:', e);
  }
}

export function playErase(): void {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn('AudioContext failed:', e);
  }
}

export function playError(): void {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Low buzz error sound (two consecutive short tones)
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const delay = i * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now + delay);

      gainNode.gain.setValueAtTime(0.08, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);

      // Low pass filter to make synth nicer
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now + delay);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.1);
    }
  } catch (e) {
    console.warn('AudioContext failed:', e);
  }
}

export function playWinSound(): void {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Ascending arpeggio sound (C Major or pentatonic scale)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const delay = idx * 0.10;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gainNode.gain.setValueAtTime(0.0, now + delay);
      gainNode.gain.linearRampToValueAtTime(0.08, now + delay + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.005, now + delay + 0.4);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.4);
    });
  } catch (e) {
    console.warn('AudioContext failed:', e);
  }
}
