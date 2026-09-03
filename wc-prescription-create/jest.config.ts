import type { Config } from 'jest';
import { resolve } from 'node:path';
import { config as jestBaseConfig } from '../jest.base.config';

const workspaceRoot = resolve(__dirname, '..').replaceAll('\\', '/');

const config: Config = {
  ...jestBaseConfig,

  // The directory where Jest should output its coverage files
  coverageDirectory: `${workspaceRoot}/wc-prescription-create/coverage`,

  setupFilesAfterEnv: [`${workspaceRoot}/wc-prescription-create/setup-jest.ts`],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@reuse/(.*)$': `${workspaceRoot}/reuse/$1`,
    '^jose': require.resolve('jose'),
    '^@smals/vas-evaluation-form-ui-core': '@smals-belgium-shared/vas-evaluation-form-ui-core',
    '^ngx-markdown$': `${workspaceRoot}/wc-prescription-create/test/mocks/ngx-markdown.mock.ts`,
  },
  collectCoverageFrom: [
    'wc-prescription-create/src/components/**/*.ts',
    'wc-prescription-create/src/create-prescription/**/*.ts',
  ],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        isolatedModules: false,
        stringifyContentPathRegex: '\\.(html|svg)$',
        tsconfig: `${workspaceRoot}/wc-prescription-create/tsconfig.spec.json`,
      },
    ],
  },
};

export default config;
