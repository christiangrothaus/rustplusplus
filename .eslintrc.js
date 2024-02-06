module.exports = {
  'env': {
    'browser': true,
    'es2021': true
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
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module'
  },
  'plugins': [
    '@typescript-eslint',
    '@stylistic/ts'
  ],
  'rules': {
    '@typescript-eslint/no-explicit-any': 'off',
    '@stylistic/ts/indent': ['error', 2],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    '@stylistic/ts/comma-dangle': ['error', 'never'],
    '@stylistic/ts/object-curly-spacing': ['error', 'always'],
    'no-trailing-spaces': 'error'
  }
};
