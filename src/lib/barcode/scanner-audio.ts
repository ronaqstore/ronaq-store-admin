import type { WindowWithWebkitAudio } from '@/types/barcode';

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
    if (AudioCtx) {
      try {
        sharedAudioCtx = new AudioCtx();
      } catch {
        sharedAudioCtx = null;
      }
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => {
      sharedAudioCtx = null;
    });
  }
  return sharedAudioCtx;
}

export function playScanBeep(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const play = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    };

    if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(play)
        .catch(() => {
          sharedAudioCtx = null;
        });
    } else {
      play();
    }
  } catch {
    sharedAudioCtx = null;
  }
}
