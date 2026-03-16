import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ActiveOverlayHostService {
  private _host: HTMLElement | null = null;

  set(el: HTMLElement): void {
    this._host = el;
  }
  clear(el: HTMLElement): void {
    if (this._host === el) this._host = null;
  }
  get(): HTMLElement | null {
    return this._host;
  }
}
