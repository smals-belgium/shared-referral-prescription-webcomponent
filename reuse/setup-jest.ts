{
  const { setupZonelessTestEnv } = require('jest-preset-angular/setup-env/zoneless');
  const { getTestBed } = require('@angular/core/testing');
  const { randomUUID, webcrypto } = require('node:crypto');

  // Reset any prior TestBed init (e.g. zone-based setup injected by @angular-builders/jest default config)
  // getTestBed().resetTestEnvironment();

  if (!getTestBed().platform) {
    setupZonelessTestEnv();
  }
  global.TextEncoder = require('node:util').TextEncoder;
  global.TextDecoder = require('node:util').TextDecoder;

  const cryptoShim = {
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    randomUUID,
    subtle: webcrypto.subtle,
  };

  Object.defineProperty(globalThis, 'crypto', {
    value: cryptoShim,
    configurable: true,
  });

  beforeAll(async () => {
    const key = await webcrypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
    globalThis.CryptoKey = key.constructor;
  });
}
