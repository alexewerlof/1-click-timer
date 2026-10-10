import js from '@eslint/js'
import globals from 'globals'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    {
        ignores: ['dist/', 'node_modules/', '.agents/', 'dashboard/', 'snapshots/', 'vector/'],
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
