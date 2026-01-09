import { Configuration } from '@reuse/code/openapi';
import { ConfigurationService } from '@reuse/code/services/config/configuration.service';

export function provideOpenApi() {
  return {
    provide: Configuration,
    useFactory: (wcCofig: ConfigurationService) =>
      new Configuration({
        basePath: wcCofig.getEnvironmentVariable('apiUrl'),
      }),
    deps: [ConfigurationService],
    multi: false,
  };
}
