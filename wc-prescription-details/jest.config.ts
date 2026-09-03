/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';
import { resolve } from 'node:path';
import { config as jestBaseConfig } from '../jest.base.config';

const workspaceRoot = resolve(__dirname, '..').replace(/\\/g, '/');

const config: Config = {
  ...jestBaseConfig,
  preset: 'jest-preset-angular',

  // The directory where Jest should output its coverage files
  coverageDirectory: `${workspaceRoot}/wc-prescription-details/coverage`,

  setupFilesAfterEnv: [`${workspaceRoot}/setup-jest.ts`],
  testEnvironment: `${workspaceRoot}/wc-prescription-details/custom-jsdom-environment.ts`,

  // Module name mapper with paths configuration
  moduleNameMapper: {
    '^@reuse/(.*)$': `${workspaceRoot}/reuse/$1`,
    '^jose$': require.resolve('jose'),
    '^@smals/vas-evaluation-form-ui-core$': '@smals-belgium-shared/vas-evaluation-form-ui-core',
    '^ngx-markdown$': `${workspaceRoot}/wc-prescription-create/test/mocks/ngx-markdown.mock.ts`,
  },
  collectCoverageFrom: [
    'wc-prescription-details/src/components/**/*.ts',
    'wc-prescription-details/src/containers/**/*.ts',
  ],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        isolatedModules: false,
        stringifyContentPathRegex: '\\.(html|svg)$',
        tsconfig: `${workspaceRoot}/wc-prescription-details/tsconfig.spec.json`,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
};

export default config;
