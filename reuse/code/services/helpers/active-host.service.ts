import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ActiveOverlayHostService {
  private activeHost = signal<HTMLElement | null>(null);

  set(el: HTMLElement): void {
    el.addEventListener('focusin', this.onActivate);
    el.addEventListener('pointerdown', this.onActivate);
  }

  get(): HTMLElement | null {
    return this.activeHost();
  }

  clear(el: HTMLElement): void {
    el.removeEventListener('focusin', this.onActivate);
    el.removeEventListener('pointerdown', this.onActivate);
    if (this.activeHost() === el) {
      this.activeHost.set(null);
    }
  }

  private onActivate = (event: Event): void => {
    const el = event.currentTarget as HTMLElement;
    if (this.activeHost() === el) return;

    this.activeHost.set(el);
  };
}
