// @ts-check
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': 'error',
    },
  },
  {
    // Guardrail: nothing under src/client may import Node built-ins.
    files: ['src/client/**/*.ts', 'src/client.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['node:*'], message: 'Client modules must never import Node built-ins.' },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
];
