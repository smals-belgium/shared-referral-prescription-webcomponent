import { importProvidersFrom, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';
import { WcConfigurationService } from '@reuse/code/services/config/wc-configuration.service';
import { provideCore } from '@reuse/code/providers/core.provider';
import { apiUrlInterceptor } from '@reuse/code/interceptors/api-url.interceptor';
import { AuthService } from '@reuse/code/services/auth/auth.service';
import { WcAuthService } from '@reuse/code/services/auth/wc-auth.service';
import { WcTranslateLoader } from '@reuse/code/services/helpers/translate.loader';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { providePseudonymisation } from '@reuse/code/providers/pseudo.provider';
import { provideOpenApi } from '@reuse/code/providers/open-api.provider';
import { AppPrescriptionDetails } from './app/app';
import { demoHttpInterceptor } from '@reuse/code/demo/demo-http.interceptor';
import { provideShadowDom } from '@reuse/code/shadow-dom/shadow-dom.provider';

try {
  await bootstrapApplication(AppPrescriptionDetails, {
    providers: [
      provideZonelessChangeDetection(),
      provideBrowserGlobalErrorListeners(),
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
      provideShadowDom(),
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
} catch (err) {
  console.error(err);
}
