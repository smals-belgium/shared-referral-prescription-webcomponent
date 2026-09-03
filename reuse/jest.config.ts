/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import { resolve } from 'node:path';
import type { Config } from 'jest';
import { config as jestBaseConfig } from '../jest.base.config';

// Always resolve from this file's location
const projectRoot = resolve(__dirname, '..');
const workspaceRoot = projectRoot.replaceAll('\\', '/');

const config: Config = {
  ...jestBaseConfig,
  rootDir: projectRoot,

  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/reuse/coverage',
  roots: ['<rootDir>/reuse/code'],

  setupFilesAfterEnv: ['<rootDir>/reuse/setup-jest.ts'],
  testEnvironment: '<rootDir>/reuse/custom-jsdom-environment.ts',

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^jose$': 'jose',
    '^@reuse/(.*)$': `${resolve(projectRoot, 'reuse')}/$1`,
    '^@smals/vas-evaluation-form-ui-core': '@smals-belgium-shared/vas-evaluation-form-ui-core',
    '^ngx-markdown$': `${workspaceRoot}/wc-prescription-create/test/mocks/ngx-markdown.mock.ts`,
    '^marked$': `${workspaceRoot}/reuse/test/mocks/marked.mock.ts`,
  },
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        isolatedModules: false,
        stringifyContentPathRegex: '\\.(html|svg)$',
        tsconfig: `${workspaceRoot}/reuse/tsconfig.spec.json`,
      },
    ],
  },
  transformIgnorePatterns: [],
};

export default config;
