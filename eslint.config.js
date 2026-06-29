import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "node_modules/",
      "igloknlllonknnbkfgggfkigmeegmakf/",
      "snapshots/",
      "vector/",
      "dashboard/",
      "latest/",
    ],
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
      globals: { ...globals.browser, ...globals.webextensions },
    },
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
