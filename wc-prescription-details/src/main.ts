import {ErrorHandler, importProvidersFrom} from "@angular/core";
import {createApplication} from "@angular/platform-browser";
import {createCustomElement} from "@angular/elements";
import {PrescriptionDetailsWebComponent} from "./components/prescription-details/prescription-details.component";
import {provideAnimations} from "@angular/platform-browser/animations";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { ConfigurationService } from '@reuse/code/services/configuration.service';
import {WcConfigurationService} from "@reuse/code/services/wc-configuration.service";
import { provideCore } from '@reuse/code/providers/core.provider';
import { apiUrlInterceptor } from '@reuse/code/services/api-url.interceptor';
import {AuthService} from "@reuse/code/services/auth.service";
import { WcAuthService } from '@reuse/code/services/wc-auth.service';
import { getErrorHandlerFromConfiguration } from '@reuse/code/services/sentry-error-handler.service';
import { WcTranslateLoader } from '@reuse/code/services/translate.loader';
import {MatDialogModule} from "@angular/material/dialog";
import {TranslateCompiler, TranslateLoader, TranslateModule} from "@ngx-translate/core";
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import {providePseudonymisation} from "@reuse/code/providers/pseudo.provider";

(async () => {
  const app = createApplication({
    providers:[
      provideAnimations(),
      provideCore(),
      provideHttpClient(withInterceptors([apiUrlInterceptor])),
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
    ]});

  const prescriptionDetailElement = createCustomElement(PrescriptionDetailsWebComponent, {
    injector: (await app).injector
  });
  customElements.define('nihdi-referral-prescription-details', prescriptionDetailElement);

})();
