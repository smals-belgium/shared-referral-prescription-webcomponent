import { APP_ID, CSP_NONCE, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ɵSharedStylesHost } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class StyleHost extends ɵSharedStylesHost {
  document = inject(DOCUMENT);

  constructor() {
    super(document, inject(APP_ID), inject(CSP_NONCE, { optional: true }), inject(PLATFORM_ID));

    this.removeHost(document.head);
  }
}
