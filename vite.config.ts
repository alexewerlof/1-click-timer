import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

const ROOT = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(ROOT, 'src')
const DIST = resolve(ROOT, 'dist')

/**
 * Files Chrome needs verbatim next to the manifest. Vite only knows about
 * imports, so anything referenced by `manifest.json` is copied by hand.
 */
const STATIC_ASSETS = ['manifest.json', 'images', 'audio'] as const

function copyAsset(relativePath: string): void {
    const from = resolve(SRC, relativePath)
    if (!existsSync(from)) {
        console.warn('[extension-assets] missing:', relativePath)
        return
    }
    const to = resolve(DIST, relativePath)
    mkdirSync(dirname(to), { recursive: true })
    cpSync(from, to, { recursive: true })
}

function extensionAssets() {
    return {
        name: 'extension-assets',
        writeBundle() {
            for (const asset of STATIC_ASSETS) copyAsset(asset)
        },
    }
}

export default defineConfig({
    // Serving `src/` as the root keeps the dev URLs identical to the built
    // extension (`/popup.html`, `/fullscreen.html`) — that is what makes the
    // design loop a plain `npm run dev`.
    root: SRC,
    // Absolute asset URLs, so moving an HTML entry never breaks its references.
    base: '/',
    plugins: [react(), extensionAssets()],
    server: {
        open: '/popup.html',
    },
    build: {
        outDir: DIST,
        emptyOutDir: true,
        // Readable output: this bundle is a locally loaded extension, not a website.
        minify: false,
        rollupOptions: {
            input: {
                popup: resolve(SRC, 'popup.html'),
                fullscreen: resolve(SRC, 'fullscreen.html'),
                background: resolve(SRC, 'background/index.ts'),
            },
            output: {
                entryFileNames: 'js/[name].js',
                chunkFileNames: 'js/[name].js',
                assetFileNames: 'assets/[name][extname]',
            },
        },
    },
})
