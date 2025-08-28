import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import importPlugin from 'eslint-plugin-import';

export default [
  // Базовые рекомендации JS и TS
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Притаскиваем Prettier как flat-конфиг
  prettierRecommended,

  // Наш слой правил (чтобы не тянуть legacy-конфиги плагинов)
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json', // если используешь typed linting
      },
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
      },
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.ts'],
        },
      },
    },
    rules: {
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          js: 'never',
        },
      ],

      // чуть построже
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',

      // Базовые best practices
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-implicit-coercion': 'warn',
      curly: ['error', 'all'],
      'no-fallthrough': 'error',

      // TS
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Стиль
      'no-multi-spaces': 'warn',
      'no-trailing-spaces': 'warn',
      'eol-last': ['error', 'always'],
      'object-shorthand': ['warn', 'always'],
      'prefer-template': 'warn',
      'arrow-body-style': ['warn', 'as-needed'],
      'prefer-arrow-callback': 'warn',

      // Импорты
      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'warn',
    },
  },

  // Игноры (замена .eslintignore)
  {
    ignores: ['dist', 'build', 'coverage', 'node_modules', '**/*.config.ts', '**/*.config.js'],
  },
];
