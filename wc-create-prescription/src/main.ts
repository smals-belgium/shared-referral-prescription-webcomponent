import { ErrorHandler, importProvidersFrom } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCore } from '@reuse/code/providers/core.provider';
import { provideEvfForm } from '@reuse/code/evf/evf-form.provider';
import { provideMarkdown } from '@reuse/code/providers/markdown.provider';
import { getErrorHandlerFromConfiguration } from '@reuse/code/services/sentry-error-handler.service';
import { createCustomElement } from '@angular/elements';
import { WcConfigurationService } from '@reuse/code/services/wc-configuration.service';
import { apiUrlInterceptor } from '@reuse/code/services/api-url.interceptor';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WcTranslateLoader } from '@reuse/code/services/translate.loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { CreatePrescriptionWebComponent } from './components/create-prescription/create-prescription.component';
import { MatDialogModule } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ConfigurationService } from '@reuse/code/services/configuration.service';
import { AuthService } from '@reuse/code/services/auth.service';
import { WcAuthService } from '@reuse/code/services/wc-auth.service';

(async () => {
  const app = createApplication({
    providers: [
      provideAnimations(),
      provideHttpClient(withInterceptors([apiUrlInterceptor])),
      provideCore(),
      provideEvfForm(),
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
        provide: ErrorHandler,
        useFactory: getErrorHandlerFromConfiguration,
        deps: [ConfigurationService]
      },
      importProvidersFrom(
        MatDialogModule,
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
  const createPrescriptionElement = createCustomElement(CreatePrescriptionWebComponent, {
    injector: (await app).injector,
  });
  customElements.define('nihdi-create-referral-prescription', createPrescriptionElement);
})();
