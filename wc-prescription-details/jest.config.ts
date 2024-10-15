/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';
import {config as jestBaseConfig} from '../jest.base.config' ;

const config: Config = {
  ...jestBaseConfig,

  // The directory where Jest should output its coverage files
  coverageDirectory: "<rootDir>/wc-prescription-details/coverage",

  setupFilesAfterEnv: ['./setup-jest.ts'],
  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  // moduleNameMapper: {
  //   "^jose": require.resolve("jose"),
  // }

  moduleNameMapper: {
    "@reuse/(.*)": "<rootDir>/reuse/$1",
    "^jose": require.resolve("jose"),
  },
  collectCoverageFrom: [
    "wc-prescription-details/src/components/**/*.ts"
  ]
};

export default config;
