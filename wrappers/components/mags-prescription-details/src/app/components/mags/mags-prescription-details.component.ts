import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MagsComponent } from '@reuse/code/components/wrappers/directives/mags.wrapper.directive';
import { wrapperManifest } from 'wrappers/components/mags-prescription-details/manifest';
import {
  PrintMimeType,
  PrintOrientation,
  SettingsChangeEvent,
  UserLanguage,
} from '@smals-belgium/myhealth-wc-integration';
import { mapLanguageToTranslations } from '@reuse/code/components/wrappers/utils/mags.utils';

@Component({
  standalone: true,
  selector: wrapperManifest.selector,
  templateUrl: 'mags-prescription-details.component.html',
  styleUrls: ['mags-prescription-details.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MagsPrescriptionDetails extends MagsComponent {
  prescriptionId = input<string | undefined>(undefined);
  intent = input<string | undefined>(undefined);
  print = output<unknown>();
  open = output<unknown>();

  blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };

      reader.onerror = () => reject(reader.error);

      reader.readAsDataURL(blob); // This encodes blob as base64 with data URL prefix
    });
  };

  override initWebComponent() {
    const webComponent = this.createElement(wrapperManifest.customElement.tag);

    webComponent.services = {
      getAccessToken: (audience: string) => this.getAccessToken(audience),
      getIdToken: () =>
        Promise.resolve({
          userProfile: {
            ssin: '80222700163',
            firstName: 'John',
            lastName: 'Doe',
            gender: 'M',
          },
        }),
    };

    webComponent.setAttribute('lang', mapLanguageToTranslations(this.userLanguage()));
    webComponent.setAttribute('prescription-id', this.prescriptionId() || '');
    webComponent.setAttribute('intent', this.intent() || 'order');

    webComponent.addEventListener('clickPrint', async (event: Event) => {
      const customEvent = event as CustomEvent<Blob>;
      const blob = customEvent.detail;

      const content = await this.blobToBase64(blob);

      this.print.emit({
        prescriptionId: this.prescriptionId(),
        lang: webComponent.lang,
        content: content,
        mimeType: PrintMimeType.BASE64,
        orientation: PrintOrientation.PORTRAIT,
      });
    });

    webComponent.addEventListener('clickOpenExtendedDetail', (d: Event & { detail?: string }) => {
      this.open.emit({
        componentTag: wrapperManifest.events['open'].componentTag,
        props: {
          prescriptionId: d?.detail,
          lang: webComponent.lang,
        },
      });
    });

    this.appendWebComponent(webComponent);
  }

  override onSettingsChanged = (s: SettingsChangeEvent): void => {
    if (s.detail.setting === 'userLanguage') {
      const w = this.componentView.nativeElement.getElementsByTagName(wrapperManifest.customElement.tag);
      w[0].setAttribute('lang', mapLanguageToTranslations(s.detail.value as unknown as UserLanguage));
    }
  };
}
