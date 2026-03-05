import { Directive, ElementRef, inject, input, OnInit } from '@angular/core';
import {
  ConfigName,
  IdToken,
  SettingsChangeEvent,
  UserLanguage,
  VersionMismatchEvent,
} from '@smals-belgium/myhealth-wc-integration';
import { HOST_SERVICES } from '../injection-tokens/host-services.injection-token';
import { HOST_SETTINGS } from '../injection-tokens/host-settings.injection-token';
import { ReferralEnv } from '@reuse/code/interfaces/environment.interface';
import { jwtDecode } from 'jwt-decode';

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

  protected abstract initWebComponent(): void;
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

  protected async getIdToken() {
    if (this.hostSettings.configName === 'demo') {
      return Promise.resolve({
        userProfile: {
          ssin: '80222700153',
          firstName: 'John',
          lastName: 'Doe',
          gender: 'M',
        },
      });
    } else {
      const idToken = await this.hostServices.getIdToken();
      return this.getDecodedIdToken(idToken);
    }
  }

  private getDecodedIdToken(idToken: IdToken) {
    if (!idToken) return null;
    try {
      return jwtDecode(idToken);
    } catch {
      return null;
    }
  }

  protected createElement(tag: string) {
    return document.createElement(tag) as HTMLElement & {
      services: Services;
    };
  }

  protected onSettingsChanged = (s: SettingsChangeEvent): void => {};

  protected onVersionMissmatch = (s: VersionMismatchEvent): void => {};
}
