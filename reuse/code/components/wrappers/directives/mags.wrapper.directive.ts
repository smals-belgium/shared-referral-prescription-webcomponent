import { Directive, ElementRef, inject, input, OnInit } from '@angular/core';
import {
  ConfigName,
  SettingsChangeEvent,
  UserLanguage,
  VersionMismatchEvent,
} from '@smals-belgium/myhealth-wc-integration';
import { HOST_SERVICES } from '../injection-tokens/host-services.injection-token';
import { HOST_SETTINGS } from '../injection-tokens/host-settings.injection-token';
import { ReferralEnv } from '@reuse/code/interfaces/environment.interface';

export interface Services {
  getAccessToken: (audience: string) => Promise<string>;
  getIdToken?: () => Promise<unknown>;
}
@Directive()
export abstract class MagsComponent implements OnInit {
  userLanguage = input<UserLanguage>();
  configName = input<ConfigName>();

  protected readonly hostServices = inject(HOST_SERVICES);
  protected readonly hostSettings = inject(HOST_SETTINGS);

  protected readonly componentView = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly envs?: Record<string, string[]> = {
    localPatient: ['dev'],
    demo: ['demo'],
    intExtPatient: ['int'],
    accPatient: ['acc'],
    prodPatient: ['prod'],
  };

  constructor() {
    this.setEnvName(this.envs);
  }

  ngOnInit() {
    this.initWebComponent();
    this.hostServices.events.addEventListener('settings-change', this.onSettingsChanged);
    this.hostServices.events.addEventListener('version-mismatch', this.onVersionMissmatch);
  }

  protected initWebComponent() {}
  protected appendWebComponent(webComponent: HTMLElement) {
    this.componentView.nativeElement.append(webComponent);
  }

  protected setEnvName(envs?: Record<string, string[]>) {
    if (envs) {
      const [referralPrescriptionEnv] =
        Object.entries(envs).find(([, configNames]) => configNames.includes(this.hostSettings.configName)) || [];
      window.referralPrescriptionEnv = referralPrescriptionEnv as ReferralEnv;
    }
  }

  protected async getAccessToken(audience?: string) {
    if (this.hostSettings.configName === 'demo') {
      return Promise.resolve('demo');
    } else {
      return this.hostServices.getAccessToken(audience);
    }
  }

  protected createElement(tag: string) {
    return document.createElement(tag) as HTMLElement & {
      services: Services;
    };
  }

  protected onSettingsChanged = (s: SettingsChangeEvent): void => {
    // console.log('settings-changed', s);
  };

  protected onVersionMissmatch = (s: VersionMismatchEvent): void => {
    // console.log('version-mismatch', s);
  };
}
