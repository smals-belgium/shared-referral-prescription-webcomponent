import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

setupZonelessTestEnv();

global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
