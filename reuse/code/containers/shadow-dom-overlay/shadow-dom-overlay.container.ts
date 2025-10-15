import { Injectable, ElementRef, Inject, OnDestroy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ShadowDomOverlayContainer extends OverlayContainer implements OnDestroy {
  constructor(@Inject(DOCUMENT) _document: any) {
    super(_document);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  getRootElement(): Element {
    // @ts-ignore
    return this._document.querySelector('nihdi-referral-prescription-list').shadowRoot;
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
