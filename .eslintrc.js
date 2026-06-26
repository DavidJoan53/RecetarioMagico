module.exports = {
  root: true,
  // 'prettier' (eslint-config-prettier) must come last so it disables the
  // base @react-native style rules that conflict with .prettierrc (e.g. semi).
  extends: ['@react-native', 'prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
  },
}
