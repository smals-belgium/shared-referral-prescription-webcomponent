import { Inject, Injectable, InjectionToken, OnDestroy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';

export const OVERLAY_QUERY_SELECTOR = new InjectionToken<string[]>('Overlay query selector');

@Injectable({ providedIn: 'root' })
export class ShadowDomOverlayContainer extends OverlayContainer implements OnDestroy {
  constructor(
    @Inject(DOCUMENT) _document: any,
    @Inject(OVERLAY_QUERY_SELECTOR) private selectors: string[]
  ) {
    super(_document);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  getRootElement(): Element | null {
    let root: Document | ShadowRoot | Element | null = this._document;
    for (const selector of this.selectors) {
      if (!root) return null;
      const next: Element | null = (root as Document | ShadowRoot | Element).querySelector(selector);
      root = next?.shadowRoot ?? next;
    }

    return root as Element | null;
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
    const rootElement = this.getRootElement();
    const parent = rootElement || this._document.body;
    parent.appendChild(this._containerElement);
  }
}
