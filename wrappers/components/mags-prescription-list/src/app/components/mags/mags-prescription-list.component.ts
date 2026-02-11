import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  output,
  input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MagsComponent, Services } from '@reuse/code/components/wrappers/directives/mags.wrapper.directive';
import { wrapperManifest } from 'wrappers/components/mags-prescription-list/manifest';
import { SettingsChangeEvent } from '@smals-belgium/myhealth-wc-integration';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  standalone: true,
  selector: wrapperManifest.selector,
  templateUrl: 'mags-prescription-list.component.html',
  styleUrls: ['mags-prescription-list.component.scss'],
  imports: [CommonModule, TranslateModule, MatTabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MagsPrescriptionList extends MagsComponent implements AfterViewInit {
  private readonly _translate = inject(TranslateService);
  patientSsin = input<string | undefined>(undefined);
  open = output<unknown>();

  @ViewChild('orderHost', { read: ElementRef }) orderHost!: ElementRef<HTMLElement>;
  @ViewChild('proposalHost', { read: ElementRef }) proposalHost!: ElementRef<HTMLElement>;

  private instances = new Map<'order' | 'proposal', HTMLElement>();
  private activeIntent: 'order' | 'proposal' = 'order';

  ngAfterViewInit() {
    this.activate('order'); // default tab
  }

  onTabChange(index: number) {
    this.activate(index === 0 ? 'order' : 'proposal');
  }

  private activate(intent: 'order' | 'proposal') {
    if (!this.instances.has(intent)) {
      this.createWebcomponent(intent);
    }
    this.activeIntent = intent;
  }

  private createWebcomponent(intent: 'order' | 'proposal') {
    const el = document.createElement(wrapperManifest.customElement.tag) as HTMLElement & {
      services: Services;
    };

    el.services = {
      getAccessToken: (audience: string) => this.getAccessToken(audience),
    };

    el.setAttribute('lang', `${this.userLanguage()}-BE`);
    el.setAttribute('patient-ssin', this.patientSsin()!);
    el.setAttribute('intent', intent);

    el.addEventListener('clickOpenDetail', this.onOpenDetail);

    const host = intent === 'order' ? this.orderHost.nativeElement : this.proposalHost.nativeElement;

    host.appendChild(el);
    this.instances.set(intent, el);
  }

  private onOpenDetail = (d: Event & { detail?: any }) => {
    this.open.emit({
      componentTag: wrapperManifest.events['open'].componentTag,
      props: {
        prescriptionId: d?.detail?.id,
        intent: this.activeIntent,
        lang: this.instances.get(this.activeIntent)?.getAttribute('lang'),
      },
    });
  };

  override initWebComponent() {
    if (!this.patientSsin()) {
      console.error('patient ssin is required');
      return;
    }

    this._translate.use(`${this.userLanguage()}-BE`);
  }

  override onSettingsChanged = (s: SettingsChangeEvent): void => {
    if (s.detail.setting !== 'userLanguage') {
      return;
    }

    const lang = `${s.detail.value}-BE`;
    this._translate.use(lang);

    for (const wc of this.instances.values()) {
      wc.setAttribute('lang', lang);
    }
  };
}
