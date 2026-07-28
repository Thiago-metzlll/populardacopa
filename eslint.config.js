// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "import/first": "off", // jest.mock() precisa vir antes dos imports pro hoisting funcionar
    },
  },
]);
