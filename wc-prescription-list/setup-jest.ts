{
  const { setupZonelessTestEnv } = require('jest-preset-angular/setup-env/zoneless');
  const { getTestBed } = require('@angular/core/testing');
  const { randomUUID, webcrypto } = require('node:crypto');

  // Reset any prior TestBed init (e.g. zone-based setup injected by @angular-builders/jest default config)
  getTestBed().resetTestEnvironment();
  setupZonelessTestEnv();
  const cryptoShim = {
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    randomUUID,
    subtle: webcrypto.subtle,
  };

  Object.defineProperty(globalThis, 'crypto', {
    value: cryptoShim,
    configurable: true,
  });
}
