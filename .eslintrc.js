module.exports = {
  extends: ['alloy', 'alloy/react', 'alloy/typescript'],
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    complexity: ['error', 50], // allow max function count in hooks,default 20
    'max-params': ['error', 5], // allow max params in function
    'no-require-imports': 0, // allow require
    'no-case-declarations': 0,
    'no-inner-declarations': 0,
    'prefer-promise-reject-errors': 0,
    'import/no-extraneous-dependencies': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-explicit-any': ['off'],
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./configs/webpack.config.eslint.js'),
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
