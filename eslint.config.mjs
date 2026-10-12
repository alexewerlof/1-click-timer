import js from '@eslint/js'
import globals from 'globals'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    {
        ignores: ['dist/', 'node_modules/', '.agents/', 'dashboard/', 'vector/'],
    },

    js.configs.recommended,
    ...tseslint.configs.recommended,

    {
        files: ['**/*.{ts,tsx,mjs,js}'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
        },
    },

    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.webextensions },
        },
    },

    {
        // The store capture runs in Node but drives a browser: the outer script
        // uses Node globals, and the callbacks handed to `page.evaluate` run in
        // the page, where `document` and `matchMedia` are real.
        files: ['scripts/**/*.mjs'],
        languageOptions: {
            globals: { ...globals.node, ...globals.browser },
        },
    },

    {
        files: ['src/app/**/*.{ts,tsx}'],
        plugins: {
            ...reactHooks.configs.flat.recommended.plugins,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.flat.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },

    {
        files: ['*.config.{ts,js,mjs}'],
        languageOptions: {
            globals: { ...globals.node },
        },
    },

    // Must stay last: turns off every rule that conflicts with Prettier.
    prettier,
)
