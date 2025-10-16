import { createApplication } from '@angular/platform-browser';
import { provideEvfForm } from '@reuse/code/evf/evf-form.provider';
import { provideMarkdown } from '@reuse/code/providers/markdown.provider';
import { createCustomElement } from '@angular/elements';
import { EvfFormWebComponent } from './components/evf-form/evf-form.component';
import { provideCore } from '@reuse/code/providers/core.provider';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { apiUrlInterceptor } from '@reuse/code/interceptors/api-url.interceptor';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { WcAuthService } from '@reuse/code/services/auth/wc-auth.service';
import { ErrorHandler, importProvidersFrom } from '@angular/core';
import { getErrorHandlerFromConfiguration } from '@reuse/code/services/helpers/sentry-error-handler.service';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WcTranslateLoader } from '@reuse/code/services/helpers/translate.loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { provideOpenApi } from '@reuse/code/providers/open-api.provider';
import {
  OVERLAY_QUERY_SELECTOR,
  ShadowDomOverlayContainer,
} from '@reuse/code/containers/shadow-dom-overlay/shadow-dom-overlay.container';
import { OverlayContainer } from '@angular/cdk/overlay';

(async () => {
  const app = createApplication({
    providers: [
      provideCore(),
      provideHttpClient(withInterceptors([apiUrlInterceptor])),
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
      {
        provide: OVERLAY_QUERY_SELECTOR,
        useValue: ['nihdi-referral-prescription-create', 'nihdi-referral-prescription-form'],
      },
      {
        provide: OverlayContainer,
        useClass: ShadowDomOverlayContainer,
      },
      provideOpenApi(),
      provideAnimations(),
      provideEvfForm(),
      provideMarkdown(),
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
  const evfFormElement = createCustomElement(EvfFormWebComponent, {
    injector: (await app).injector,
  });
  customElements.define('nihdi-referral-prescription-form', evfFormElement);
})();
