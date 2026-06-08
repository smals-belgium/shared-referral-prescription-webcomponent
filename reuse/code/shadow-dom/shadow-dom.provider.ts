import { OverlayContainer } from '@angular/cdk/overlay';
import { ShadowDomOverlayContainer } from '@reuse/code/shadow-dom/shadow-dom-overlay/shadow-dom-overlay.container';
import { ɵSharedStylesHost } from '@angular/platform-browser';
import { StyleHost } from '@reuse/code/shadow-dom/style-host/style-host';

export function provideShadowDom() {
  return [
    {
      provide: OverlayContainer,
      useClass: ShadowDomOverlayContainer,
    },
    {
      provide: ɵSharedStylesHost,
      useClass: StyleHost,
    },
  ];
}
