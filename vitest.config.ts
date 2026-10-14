import react from '@vitejs/plugin-react-swc'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

/**
 * Two projects, because the two kinds of test need different environments:
 *
 * - `unit`   — pure logic (dial geometry, time formatting) in node.
 * - `visual` — the real components in a real browser, so CSS Modules and SVG
 *              rendering are actually exercised, with screenshot assertions.
 *
 * `npm test` runs `unit`; `npm run test:visual` runs the browser project.
 */
export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'unit',
                    environment: 'node',
                    include: ['src/**/*.test.ts'],
                },
            },
            {
                plugins: [react()],
                test: {
                    name: 'visual',
                    include: ['src/**/*.visual.test.tsx'],
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright(),
                        instances: [{ browser: 'chromium' }],
                        screenshotFailures: false,
                    },
                },
            },
        ],
    },
})
