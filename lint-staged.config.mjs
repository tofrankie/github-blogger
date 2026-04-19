export default {
  '*.{js,mjs,cjs,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yaml,yml}': ['prettier --write'],
  '*.{html,css}': ['prettier --write', 'stylelint --fix'],
}
