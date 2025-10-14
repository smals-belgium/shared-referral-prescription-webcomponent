import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  getEnvironment(): string {
    throw new Error('Not implemented');
  }

  getEnvironmentVariable(key: string): any {
    throw new Error('Not implemented');
  }
}
