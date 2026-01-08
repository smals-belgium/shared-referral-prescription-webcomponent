/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';
import { config as jestBaseConfig } from '../jest.base.config';

const config: Config = {
  ...jestBaseConfig,

  // The directory where Jest should output its coverage files
  coverageDirectory: '<rootDir>/wc-prescription-list/coverage',

  setupFilesAfterEnv: ['./setup-jest.ts'],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '@reuse/(.*)': '<rootDir>/reuse/$1',
    '^jose': require.resolve('jose'),
  },
  collectCoverageFrom: ['wc-prescription-list/src/components/**/*.ts'],
  transform: {
    '^.+\\.(ts|html)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/wc-prescription-list/tsconfig.spec.json',
      },
    ],
  },
};

export default config;
