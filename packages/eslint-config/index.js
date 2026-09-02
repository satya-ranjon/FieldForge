import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const javascriptRecommended = {
  ...js.configs.recommended,
  files: ['**/*.{js,mjs,cjs}'],
  languageOptions: {
    ...js.configs.recommended.languageOptions,
    globals: {
      ...globals.node
    }
  }
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.expo/**',
      '**/.next/**',
      'packages/database/src/migrations/**'
    ]
  },
  javascriptRecommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}']
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      // NestJS constructor injection relies on runtime import metadata, so a
      // blanket type-only import rule is unsafe for this mixed monorepo.
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  eslintConfigPrettier
);
