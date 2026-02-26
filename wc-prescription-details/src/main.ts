import { importProvidersFrom } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { PrescriptionDetailsWebComponent } from './containers/prescription-details/prescription-details.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';
import { provideCore } from '@reuse/code/providers/core.provider';
import { apiUrlInterceptor } from '@reuse/code/interceptors/api-url.interceptor';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { WcAuthService } from '@reuse/code/services/auth/wc-auth.service';
import { WcTranslateLoader } from '@reuse/code/services/helpers/translate.loader';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { providePseudonymisation } from '@reuse/code/providers/pseudo.provider';
import { provideOpenApi } from '@reuse/code/providers/open-api.provider';
import { OverlayContainer } from '@angular/cdk/overlay';
import {
  OVERLAY_QUERY_SELECTOR,
  ShadowDomOverlayContainer,
} from '@reuse/code/containers/shadow-dom-overlay/shadow-dom-overlay.container';
import { provideEvfForm } from '@reuse/code/evf/evf-form.provider';
import { provideMarkdown } from '@reuse/code/providers/markdown.provider';
import { demoHttpInterceptor } from '@reuse/code/demo/demo-http.interceptor';
import { PseudoService } from '@reuse/code/services/privacy/pseudo.service';
import { PseudonymisationHelper } from '@smals-belgium-shared/pseudo-helper';
import { DemoPseudoService } from '@reuse/code/services/privacy/demo-pseudo.service';
import { provideEvfFormDetails } from '@reuse/code/evf/evf-form-details.provider';

void (async () => {
  const configurationService = new WcConfigurationService();

  await configurationService.waitUntilReady();

  const env = configurationService.getEnvironment();

  const app = createApplication({
    providers: [
      provideCore(),
      provideHttpClient(withInterceptors([env === 'demo' ? demoHttpInterceptor : apiUrlInterceptor])),
      providePseudonymisation(),
      provideEvfForm(),
      provideEvfFormDetails(),
      provideMarkdown(),
      {
        provide: ConfigurationService,
        useClass: WcConfigurationService,
      },
      {
        provide: AuthService,
        useClass: WcAuthService,
      },
      {
        provide: PseudoService,
        useFactory: (config: ConfigurationService, pseudoHelper: PseudonymisationHelper) => {
          if (env === 'demo') {
            return new DemoPseudoService();
          }
          return new PseudoService(config, pseudoHelper);
        },
        deps: [ConfigurationService, PseudonymisationHelper],
      },
      {
        provide: OVERLAY_QUERY_SELECTOR,
        useValue: ['nihdi-referral-prescription-details'],
      },
      {
        provide: OverlayContainer,
        useClass: ShadowDomOverlayContainer,
      },
      provideOpenApi(),
      provideMarkdown(),
      importProvidersFrom(
        BrowserAnimationsModule,
        MatDialogModule,
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

  const prescriptionDetailElement = createCustomElement(PrescriptionDetailsWebComponent, {
    injector: (await app).injector,
  });
  customElements.define('nihdi-referral-prescription-details', prescriptionDetailElement);
})();
