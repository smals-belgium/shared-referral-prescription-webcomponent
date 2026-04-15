import { importProvidersFrom } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCore } from '@reuse/code/providers/core.provider';
import { provideEvfForm } from '@reuse/code/evf/evf-form.provider';
import { MARKDOWN_OPTIONS_CONFIG, provideMarkdown } from '@reuse/code/providers/markdown.provider';
import { createCustomElement } from '@angular/elements';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';
import { apiUrlInterceptor } from '@reuse/code/interceptors/api-url.interceptor';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WcTranslateLoader } from '@reuse/code/services/helpers/translate.loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { CreatePrescriptionWebComponent } from './create-prescription/create-prescription.component';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { WcAuthService } from '@reuse/code/services/auth/wc-auth.service';
import { providePseudonymisation } from '@reuse/code/providers/pseudo.provider';
import { provideOpenApi } from '@reuse/code/providers/open-api.provider';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ShadowDomOverlayContainer } from '@reuse/code/containers/shadow-dom-overlay/shadow-dom-overlay.container';
import { CUSTOM_ELEMENT_NAME_NIHDI_REFERRAL_PRESCRIPTION_CREATE } from '@reuse/code/constants/common.constants';

(async () => {
  const app = createApplication({
    providers: [
      provideHttpClient(withInterceptors([apiUrlInterceptor])),
      providePseudonymisation(),
      provideCore(),
      provideEvfForm(),
      { provide: MARKDOWN_OPTIONS_CONFIG, useValue: { open: true } },
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
        provide: OverlayContainer,
        useClass: ShadowDomOverlayContainer,
      },
      provideOpenApi(),
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
  const createPrescriptionElement = createCustomElement(CreatePrescriptionWebComponent, {
    injector: (await app).injector,
  });
  customElements.define(CUSTOM_ELEMENT_NAME_NIHDI_REFERRAL_PRESCRIPTION_CREATE, createPrescriptionElement);
})();
