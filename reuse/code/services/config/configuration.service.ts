export abstract class ConfigurationService {
  getEnvironment(): string {
    throw new Error('Not implemented');
  }

  getEnvironmentVariable(key: string): any {
    throw new Error('Not implemented');
  }
}
