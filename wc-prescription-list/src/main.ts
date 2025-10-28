import { ErrorHandler, importProvidersFrom } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { getErrorHandlerFromConfiguration } from '@reuse/code/services/helpers/sentry-error-handler.service';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';
import { apiUrlInterceptor } from '@reuse/code/interceptors/api-url.interceptor';
import { createCustomElement } from '@angular/elements';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WcTranslateLoader } from '@reuse/code/services/helpers/translate.loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { PrescriptionListWebComponent } from './prescription-list/prescription-list.component';
import { provideCore } from '@reuse/code/providers/core.provider';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { WcAuthService } from '@reuse/code/services/auth/wc-auth.service';
import { providePseudonymisation } from '@reuse/code/providers/pseudo.provider';
import { provideOpenApi } from '@reuse/code/providers/open-api.provider';
import {
  OVERLAY_QUERY_SELECTOR,
  ShadowDomOverlayContainer,
} from '@reuse/code/containers/shadow-dom-overlay/shadow-dom-overlay.container';
import { OverlayContainer } from '@angular/cdk/overlay';
import { demoHttpInterceptor } from '@reuse/code/demo/demo-http.interceptor';

(async () => {
  const app = createApplication({
    providers: [
      provideCore(),
      provideHttpClient(withInterceptors([demoHttpInterceptor, apiUrlInterceptor])),
      providePseudonymisation(),
      {
        provide: ConfigurationService,
        useClass: WcConfigurationService,
      },
      {
        provide: AuthService,
        useClass: WcAuthService,
      },
      {
        provide: ErrorHandler,
        useFactory: getErrorHandlerFromConfiguration,
        deps: [ConfigurationService],
      },
      { provide: OVERLAY_QUERY_SELECTOR, useValue: ['nihdi-referral-prescription-list'] },
      {
        provide: OverlayContainer,
        useClass: ShadowDomOverlayContainer,
      },
      provideOpenApi(),
      importProvidersFrom(
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: WcTranslateLoader,
          },
          compiler: {
            provide: TranslateCompiler,
            useClass: TranslateMessageFormatCompiler,
          },
        })
      ),
    ],
  });
  const prescriptionListElement = createCustomElement(PrescriptionListWebComponent, {
    injector: (await app).injector,
  });
  customElements.define('nihdi-referral-prescription-list', prescriptionListElement);
})();
