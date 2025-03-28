import { Component, HostBinding, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {TranslateModule} from "@ngx-translate/core";

@Component({
    selector: 'app-overlay-spinner',
    imports: [
        MatProgressSpinnerModule,
        TranslateModule
    ],
    template: `
    <mat-progress-spinner color="primary" mode="indeterminate" diameter="75" [attr.aria-label]="'common.ariaLabel.loading' | translate"></mat-progress-spinner>`,
    styles: [`
    :host {
      display: flex;
      min-width: 150px;
      width: 100%;
      height: 100%;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      align-items: center;
      justify-content: center;
    }

    :host.dialog {
      position: absolute;
      z-index: 1000;
      background-color: rgba(0, 0, 0, 0.2);
    }

    :host.inline {
      position: relative;
      height: 150px;
    }

    :host.page {
      position: fixed;
      z-index: 1000;
      background-color: rgba(0, 0, 0, 0.2);
    }
  `]
})
export class OverlaySpinnerComponent {

  @HostBinding('class')
  @Input() mode: 'page' | 'inline' | 'dialog' = 'page';

}
