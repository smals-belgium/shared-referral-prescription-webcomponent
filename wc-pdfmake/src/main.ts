import { ErrorHandler, importProvidersFrom } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { provideCore } from '@reuse/code/providers/core.provider';
import { getErrorHandlerFromConfiguration } from '@reuse/code/services/helpers/sentry-error-handler.service';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WcTranslateLoader } from '@reuse/code/services/helpers/translate.loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { createCustomElement } from '@angular/elements';
import { PdfMakeWebComponent } from './components/pdfmake/pdf-make.component';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';

(async () => {
  const app = createApplication({
    providers: [
      provideCore(),
      {
        provide: ConfigurationService,
        useClass: WcConfigurationService,
      },
      {
        provide: ErrorHandler,
        useFactory: getErrorHandlerFromConfiguration,
        deps: [ConfigurationService]
      },
      importProvidersFrom(
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: WcTranslateLoader
          },
          compiler: {
            provide: TranslateCompiler,
            useClass: TranslateMessageFormatCompiler
          }
        }),
      )
    ],
  });

  const prescriptionListElement = createCustomElement(PdfMakeWebComponent, {
    injector: (await app).injector
  });
  customElements.define('nihdi-referral-prescription-pdf', prescriptionListElement);
})();
