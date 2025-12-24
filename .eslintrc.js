module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-console': 0,
    'no-param-reassign': 0,
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      ts: 'never',
    }],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
  overrides: [
    {
      // TypeScript files
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'airbnb-base',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'no-console': 0,
        'no-param-reassign': 0,
        // Disable import/extensions for TypeScript
        'import/extensions': 0,
        // Disable import/no-unresolved for TypeScript (use tsc for resolution)
        'import/no-unresolved': 0,
        // Allow unused vars starting with underscore
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        // Allow require() for CommonJS compatibility
        '@typescript-eslint/no-require-imports': 'off',
        // Increase max line length
        'max-len': ['error', { code: 120 }],
        // Allow named exports (common in TypeScript)
        'import/prefer-default-export': 0,
        // Allow namespaces for global augmentation
        '@typescript-eslint/no-namespace': 0,
        // Disable no-use-before-define for types (circular refs are common)
        'no-use-before-define': 0,
      },
    },
    {
      // Test files
      files: ['tests/**/*.ts', 'tests/**/*.js'],
      env: {
        jest: true,
      },
      rules: {
        // Allow any in tests for mocking
        '@typescript-eslint/no-explicit-any': 'off',
        // Relax line length for tests
        'max-len': ['error', { code: 140 }],
      },
    },
  ],
};
