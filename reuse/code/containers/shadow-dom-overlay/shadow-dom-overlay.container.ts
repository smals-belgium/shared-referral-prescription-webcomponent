import { Inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';

export const OVERLAY_QUERY_SELECTOR = new InjectionToken<string[]>('Overlay query selector');

@Injectable({ providedIn: 'root' })
export class ShadowDomOverlayContainer extends OverlayContainer implements OnDestroy {
  constructor(
    @Inject(DOCUMENT) _document: Document,
    @Inject(OVERLAY_QUERY_SELECTOR) private selectors: string[]
  ) {
    super(_document);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  getRootElements(): Element[] {
    let roots: (Document | ShadowRoot | Element)[] = [this._document];

    for (const selector of this.selectors) {
      const nextRoots: (ShadowRoot | Element)[] = [];

      for (const root of roots) {
        const matches = Array.from(root.querySelectorAll(selector));
        for (const el of matches) {
          nextRoots.push(el.shadowRoot ?? el);
        }
      }

      roots = nextRoots;
    }

    return roots as Element[];
  }

  createContainer(): void {
    this._createContainer();
  }

  public override getContainerElement(): HTMLElement {
    if (!this._containerElement || !this._containerElement.isConnected) {
      this._createContainer();
    }

    return this._containerElement;
  }

  protected override _createContainer(): void {
    super._createContainer();
    this._appendToRootComponent();
  }

  private _appendToRootComponent(): void {
    if (!this._containerElement) {
      return;
    }
    const roots = this.getRootElements();
    const parents = roots.length ? roots : [this._document.body];

    for (const parent of parents) {
      if (!parent.contains(this._containerElement)) {
        // Clone node because we need multiple instances
        parent.appendChild(this._containerElement.cloneNode(true));
      }
    }
  }
}
