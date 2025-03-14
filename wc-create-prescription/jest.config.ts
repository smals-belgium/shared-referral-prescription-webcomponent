import type {Config} from 'jest';
import {config as jestBaseConfig} from '../jest.base.config' ;

const config: Config = {
  ...jestBaseConfig,

  // The directory where Jest should output its coverage files
  coverageDirectory: "<rootDir>/wc-create-prescription/coverage",

  setupFilesAfterEnv: ['./setup-jest.ts'],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    "@reuse/(.*)": "<rootDir>/reuse/$1",
    "^jose": require.resolve("jose"),
  },
  collectCoverageFrom: [
    "wc-create-prescription/src/components/**/*.ts"
  ],
  transform: {
    '^.+\\.(ts|html)$': ['ts-jest', {
      tsconfig: '<rootDir>/wc-create-prescription/tsconfig.spec.json',
    }],
  },
};

export default config;
