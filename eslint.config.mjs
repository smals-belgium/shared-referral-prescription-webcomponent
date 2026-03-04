import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import angularEslintTemplate from "@angular-eslint/eslint-plugin-template";
import parser from "@angular-eslint/template-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const tsFiles = [
  "reuse/code/**/*.ts",
  "wc-prescription-create/src/**/*.ts",
  "wc-evf-form/src/**/*.ts",
  "wc-evf-form-details/src/**/*.ts",
  "wc-prescription-list/src/**/*.ts",
  "wc-pdfmake/src/**/*.ts",
  "wc-prescription-details/src/**/*.ts",
];

export default defineConfig([
  globalIgnores(["**/node_modules", "**/dist"]),

  {
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      "@angular-eslint/component-class-suffix": ["error", {
        suffixes: ["Component", "Container", "Page", "Dialog", "Details", "List"],
      }],
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/dot-notation": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-member-accessibility": ["off", {
        accessibility: "explicit",
      }],
      "@typescript-eslint/no-inferrable-types": ["off", {
        ignoreParameters: true,
      }],
      "arrow-parens": ["off", "always"],
      "import/order": "off",
    },
  },

  ...compat.extends(
    "plugin:@angular-eslint/recommended",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:@angular-eslint/template/process-inline-templates",
  ).map(config => ({
    ...config,
    files: tsFiles,
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        project: ["tsconfig.json"],
        createDefaultProgram: true,
      },
    },
    rules: {
      ...config.rules,
      "@angular-eslint/component-selector": ["error", {
        type: "element",
        style: "kebab-case",
      }],
      "@angular-eslint/directive-selector": ["error", {
        type: "attribute",
        style: "camelCase",
      }],
    },
  })),

  ...compat.extends("plugin:@angular-eslint/template/recommended").map(config => ({
    ...config,
    files: ["**/*.html"],
    plugins: {
      ...config.plugins,
      "@angular-eslint/template": angularEslintTemplate,
    },
    languageOptions: {
      ...config.languageOptions,
      parser,
    },
    rules: {
      ...config.rules,
      "@angular-eslint/template/prefer-control-flow": "error",
      "@angular-eslint/template/alt-text": "error",
      "@angular-eslint/template/elements-content": "error",
      "@angular-eslint/template/button-has-type": "warn",
      "@angular-eslint/template/no-positive-tabindex": "error",
      "@angular-eslint/template/table-scope": "error",
      "@angular-eslint/template/valid-aria": "error",
      "@angular-eslint/template/click-events-have-key-events": "error",
      "@angular-eslint/template/mouse-events-have-key-events": "error",
      "@angular-eslint/template/no-autofocus": "error",
      "@angular-eslint/template/no-distracting-elements": "error",
    },
  })),

  {
    files: ["**/*.spec.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
]);
