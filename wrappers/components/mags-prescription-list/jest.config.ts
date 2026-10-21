/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';
import { resolve } from 'node:path';
import { config as jestBaseConfig } from '../../../jest.base.config';

const workspaceRoot = resolve(__dirname, '../../..').replaceAll('\\', '/');

const config: Config = {
  ...jestBaseConfig,

  // The directory where Jest should output its coverage files
  coverageDirectory: `${workspaceRoot}/wrappers/components/mags-prescription-list/coverage`,

  setupFilesAfterEnv: [`${workspaceRoot}/wrappers/components/mags-prescription-list/setup-jest.ts`],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@reuse/(.*)$': `${workspaceRoot}/reuse/$1`,
    '^jose': require.resolve('jose'),
  },
  collectCoverageFrom: ['wrappers/components/mags-prescription-list/src/app/components/mags/**/*.ts'],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        isolatedModules: false,
        stringifyContentPathRegex: String.raw`\.(html|svg)$`,
        tsconfig: `${workspaceRoot}/wrappers/components/mags-prescription-list/tsconfig.spec.json`,
      },
    ],
  },

  transformIgnorePatterns: [String.raw`node_modules/(?!.*\.mjs$)`],
};

export default config;
