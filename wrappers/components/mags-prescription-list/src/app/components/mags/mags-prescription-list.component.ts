import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  output,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MagsComponent } from '@reuse/code/components/wrappers/directives/mags.wrapper.directive';
import { jwtDecode } from '@reuse/code/utils/jwt.utils';
import { EHealthToken } from '@reuse/code/interfaces/ehealth-token.interface';
import { wrapperManifest } from 'wrappers/components/mags-prescription-list/manifest';

@Component({
  standalone: true,
  selector: wrapperManifest.selector,
  templateUrl: 'mags-prescription-list.component.html',
  styleUrls: ['mags-prescription-list.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MagsPrescriptionList extends MagsComponent {
  patientSsin = input<{ props: { patientSsin: string } } | undefined>(undefined);
  open = output<unknown>();

  override initWebComponent() {
    if (!this.patientSsin()?.props.patientSsin) {
      console.error('patient ssin is required');
      return;
    }

    const webComponent = this.createElement(wrapperManifest.customElement.tag);

    webComponent.services = {
      getAccessToken: (audience: string) => this.getAccessToken(audience),
    };

    webComponent.setAttribute('lang', `${this.userLanguage()}-BE`);
    webComponent.setAttribute('intent', 'order');
    webComponent.setAttribute('patient-ssin', this.patientSsin()!.props.patientSsin);

      webComponent.addEventListener('clickOpenDetail', (d: Event & { detail?: Record<string, any> }) => {
        this.open.emit({
          componentTag: wrapperManifest.events['open'].componentTag,
          props: {
            prescriptionId: d?.detail?.['id'],
            lang: webComponent.lang,
          },
        });
      });

    this.componentView.nativeElement.append(webComponent);
  }
}
