import { defineConfig } from '@tofrankie/eslint'

export default defineConfig({
  typescript: {
    tsconfigPath: './tsconfig.json',
    overridesTypeAware: {
      'ts/strict-boolean-expressions': 'off',
      'ts/unbound-method': 'off',
      'ts/no-floating-promises': 'off',
      'ts/no-misused-promises': 'off',
      'ts/await-thenable': 'off',
    },
  },
})
