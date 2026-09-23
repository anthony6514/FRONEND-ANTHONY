import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'butcoint-theme';
  isDark = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = saved ? saved === 'dark' : prefersDark;
      this.applyTheme(dark);
    }
  }

  toggle() {
    this.applyTheme(!this.isDark());
  }

  private applyTheme(dark: boolean) {
    this.isDark.set(dark);
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
    }
  }
}
