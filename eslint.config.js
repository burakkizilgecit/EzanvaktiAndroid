// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { files: ['plugins/**/*.js', 'scripts/**/*.js', 'tests/**/*.cjs'], languageOptions: { globals: require('globals').node } },
  {
    ignores: ['dist/*'],
  },
]);
