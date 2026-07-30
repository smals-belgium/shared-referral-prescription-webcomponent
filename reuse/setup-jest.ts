import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';
import { webcrypto } from 'node:crypto';

setupZonelessTestEnv();
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  configurable: true,
});
