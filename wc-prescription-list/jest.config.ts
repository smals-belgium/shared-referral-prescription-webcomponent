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

  // The directory where Jest should output its coverage files
  coverageDirectory: `${workspaceRoot}/wc-prescription-list/coverage`,

  setupFilesAfterEnv: [`${workspaceRoot}/wc-prescription-list/setup-jest.ts`],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@reuse/(.*)$': `${workspaceRoot}/reuse/$1`,
    '^jose': require.resolve('jose'),
    '^@smals/vas-evaluation-form-ui-core': '@smals-belgium-shared/vas-evaluation-form-ui-core',
  },
  collectCoverageFrom: [
    'wc-prescription-list/src/components/**/*.ts',
    'wc-prescription-list/src/prescription-list/**/*.ts',
  ],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        isolatedModules: false,
        stringifyContentPathRegex: '\\.(html|svg)$',
        tsconfig: `${workspaceRoot}/wc-prescription-list/tsconfig.spec.json`,
      },
    ],
  },
};

export default config;
