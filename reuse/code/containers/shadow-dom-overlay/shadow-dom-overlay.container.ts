import { inject, Inject, Injectable, OnDestroy } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import { ActiveOverlayHostService } from '@reuse/code/services/helpers/active-host.service';

@Injectable({ providedIn: 'root' })
export class ShadowDomOverlayContainer extends OverlayContainer implements OnDestroy {
  private activeHostService = inject(ActiveOverlayHostService);

  constructor(@Inject(DOCUMENT) _document: Document) {
    super(_document);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  private getRootElement(): ShadowRoot | null {
    return this.activeHostService.get()?.shadowRoot ?? null;
  }

  public override getContainerElement(): HTMLElement {
    const host = this.activeHostService.get();
    const expectedRoot = host?.shadowRoot ?? this._document.body;

    if (!this._containerElement?.isConnected || !expectedRoot.contains(this._containerElement)) {
      this._createContainer();
    }

    return this._containerElement;
  }

  protected override _createContainer(): void {
    super._createContainer();
    this._appendToRootComponent();
  }

  private _appendToRootComponent(): void {
    if (!this._containerElement) return;
    const parent = this.getRootElement() ?? this._document.body;
    parent.appendChild(this._containerElement);
  }
}
