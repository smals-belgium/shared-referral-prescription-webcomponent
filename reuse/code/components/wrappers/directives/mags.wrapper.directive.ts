import { Directive, ElementRef, inject, input, output, OnInit } from '@angular/core';
import {
  AuthenticationStatus,
  ConfigName,
  IdToken,
  OpenEventDetail,
  RefreshEvent,
  RefreshEventDetail,
  refreshEventType,
  SettingsChangeEvent,
  UserLanguage,
  VersionMismatchEvent,
  WebComponentWithSignals,
} from '@smals-belgium/myhealth-wc-integration';
import { HOST_SERVICES } from '../injection-tokens/host-services.injection-token';
import { HOST_SETTINGS } from '../injection-tokens/host-settings.injection-token';
import { ReferralEnv } from '@reuse/code/interfaces/environment.interface';
import { jwtDecode } from 'jwt-decode';
import { IdToken as UhmepIdToken } from '@reuse/code/interfaces';
import { catchError, filter, fromEvent, map, mergeMap, Observable, of, tap } from 'rxjs';

type Refresh = 'request' | 'success' | 'fail';
export interface Services {
  getAccessToken: (audience: string) => Promise<string>;
  getIdToken?: () => Promise<unknown>;
}
@Directive()
export abstract class MagsComponent implements WebComponentWithSignals, OnInit {
  protected readonly hostServices = inject(HOST_SERVICES);
  protected readonly hostSettings = inject(HOST_SETTINGS);

  readonly userLanguage = input<UserLanguage>(this.hostSettings.userLanguage);
  readonly configName = input<ConfigName>(this.hostSettings.configName);
  readonly authenticationStatus = input<AuthenticationStatus>(this.hostSettings.authenticationStatus);
  readonly crashReportingEnabled = () => false;
  readonly offlineDataStorageEnabled = () => false;
  readonly isOfflineAuthenticated = () => false;
  readonly userContactInfo = input(this.hostSettings.userContactInfo);
  readonly permissionForMandateAccess = [];

  readonly open = output<OpenEventDetail>();
  readonly refresh = output<RefreshEventDetail>();

  protected readonly componentView = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly envs?: Record<string, ConfigName[]> = {
    localPatient: [ConfigName.DEV],
    demo: [ConfigName.DEMO],
    intExtPatient: [ConfigName.INT],
    accPatient: [ConfigName.ACC],
    prodPatient: [ConfigName.PROD],
  };

  constructor() {
    this.setEnvName(this.envs);
  }

  ngOnInit() {
    this.initWebComponent();
    this.hostServices.events.addEventListener('settings-change', this.onSettingsChanged);
    this.hostServices.events.addEventListener('version-mismatch', this.onVersionMissmatch);
  }

  readonly refreshSub = fromEvent<RefreshEvent>(this.componentView.nativeElement, refreshEventType)
    .pipe(
      filter(event => event.detail.status === 'request'),
      mergeMap(() =>
        this.refreshData().pipe(
          map(() => 'success' as const),
          catchError(() => of('fail' as const))
        )
      ),
      tap(status => this.refresh.emit({ status: status as Refresh }))
    )
    .subscribe();

  protected readonly refreshData = (): Observable<unknown> => of(undefined);

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
    if (this.hostSettings.configName === ConfigName.DEMO) {
      return Promise.resolve(ConfigName.DEMO);
    } else {
      return this.hostServices.getAccessToken(audience);
    }
  }

  protected async getIdToken() {
    if (this.hostSettings.configName === ConfigName.DEMO) {
      return {
        userProfile: {
          ssin: '80222700153',
          firstName: 'John',
          lastName: 'Doe',
        },
      } as UhmepIdToken;
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
