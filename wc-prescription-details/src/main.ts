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
import { ShadowDomOverlayContainer } from '@reuse/code/containers/shadow-dom-overlay/shadow-dom-overlay.container';
import { provideEvfForm } from '@reuse/code/evf/evf-form.provider';
import { MARKDOWN_OPTIONS_CONFIG, provideMarkdown } from '@reuse/code/providers/markdown.provider';
import { demoHttpInterceptor } from '@reuse/code/demo/demo-http.interceptor';
import { provideEvfFormDetails } from '@reuse/code/evf/evf-form-details.provider';
import { CUSTOM_ELEMENT_NAME_NIHDI_REFERRAL_PRESCRIPTION_DETAILS } from '@reuse/code/constants/common.constants';

void (async () => {
  const app = createApplication({
    providers: [
      provideCore(),
      provideHttpClient(withInterceptors([demoHttpInterceptor, apiUrlInterceptor])),
      providePseudonymisation(),
      provideEvfForm(),
      provideEvfFormDetails(),
      {
        provide: ConfigurationService,
        useClass: WcConfigurationService,
      },
      {
        provide: AuthService,
        useClass: WcAuthService,
      },
      {
        provide: OverlayContainer,
        useClass: ShadowDomOverlayContainer,
      },
      provideOpenApi(),
      { provide: MARKDOWN_OPTIONS_CONFIG, useValue: { open: false } },
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
  customElements.define(CUSTOM_ELEMENT_NAME_NIHDI_REFERRAL_PRESCRIPTION_DETAILS, prescriptionDetailElement);
})();
