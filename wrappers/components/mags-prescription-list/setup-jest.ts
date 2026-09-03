{
  const { setupZonelessTestEnv } = require('jest-preset-angular/setup-env/zoneless');
  const { getTestBed } = require('@angular/core/testing');

  // Reset any prior TestBed init (e.g. zone-based setup injected by @angular-builders/jest default config)
  getTestBed().resetTestEnvironment();
  setupZonelessTestEnv();

  global.TextEncoder = require('util').TextEncoder;
  global.TextDecoder = require('util').TextDecoder;
}
