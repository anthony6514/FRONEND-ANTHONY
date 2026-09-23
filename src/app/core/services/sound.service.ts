import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type SoundType = 'click' | 'hover' | 'success' | 'error' | 'notification';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private platformId = inject(PLATFORM_ID);
  private ctx: AudioContext | null = null;
  private enabled = true;

  private getCtx(): AudioContext | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch { return null; }
    }
    return this.ctx;
  }

  toggle() { this.enabled = !this.enabled; }
  isEnabled() { return this.enabled; }

  play(type: SoundType) {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      switch (type) {
        case 'click':        this.tone(ctx, 880, 0.04, 'sine',     0.06); break;
        case 'hover':        this.tone(ctx, 660, 0.02, 'sine',     0.04); break;
        case 'success':      this.chord(ctx, [523, 659, 784],      0.08); break;
        case 'error':        this.chord(ctx, [220, 185],           0.1);  break;
        case 'notification': this.tone(ctx, 1047, 0.05, 'triangle', 0.1); break;
      }
    } catch { /* ignore */ }
  }

  private tone(ctx: AudioContext, freq: number, vol: number, type: OscillatorType, dur: number) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  private chord(ctx: AudioContext, freqs: number[], vol: number) {
    freqs.forEach((f, i) => {
      setTimeout(() => this.tone(ctx, f, vol, 'sine', 0.15), i * 60);
    });
  }
}
