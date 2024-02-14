module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    "node": true
  },
  'extends': [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  'overrides': [
    {
      'env': {
        'node': true
      },
      'files': [
        '.eslintrc.{js,cjs}'
      ],
      'parserOptions': {
        'sourceType': 'script'
      }
    }
  ],
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module',
    'project': './tsconfig.json',
    'parser': '@typescript-eslint/parser',
    'tsconfigRootDir': __dirname,
  },
  'plugins': [
    '@typescript-eslint',
    '@stylistic/ts',
    '@stylistic/js'
  ],
  'rules': {
    '@stylistic/ts/indent': ['error', 2],
    '@typescript-eslint/semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    '@stylistic/ts/comma-dangle': ['error', 'never'],
    '@stylistic/ts/object-curly-spacing': ['error', 'always'],
    'no-trailing-spaces': 'error',
    '@stylistic/ts/keyword-spacing': ['error', { 'before': true, 'after': true }],
    '@stylistic/js/no-multi-spaces': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/no-explicit-any': 'off'
  }
};
