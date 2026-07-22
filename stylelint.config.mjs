export default {
  ignoreFiles: ['node_modules/**', 'dist/**', './src/styles/lib/**'],
  extends: ['@tofrankie/stylelint'],
  overrides: [
    {
      files: ['**/*.scss'],
      extends: ['@tofrankie/stylelint/scss'],
    },
  ],
  rules: {
    'custom-property-pattern': null,
    'selector-class-pattern': null,
    'value-keyword-case': [
      'lower',
      {
        ignoreProperties: ['font-family', '--fontStack-monospace', '--fontStack-sansSerif'],
      },
    ],
    'number-max-precision': null,
  },
}
