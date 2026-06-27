import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "dist");
const SRC = resolve(__dirname, "src");
const ROOT = resolve(__dirname, ".");

/**
 * Copies a file or directory from src/ to dist/, flattening
 * the src/ prefix so src/images/ → dist/images/.
 */
function copyAsset(relPath) {
  const srcPath = resolve(SRC, relPath);
  const destPath = resolve(DIST, relPath);
  if (!existsSync(srcPath)) {
    console.warn("[copy] not found:", srcPath);
    return;
  }
  mkdirSync(resolve(destPath, ".."), { recursive: true });
  cpSync(srcPath, destPath, { recursive: true });
  console.log("[copy]", relPath, "→ dist/" + relPath);
}

/**
 * Copies a single file from an absolute source path to a path relative to dist/.
 */
function copyFile(srcAbs, destRel) {
  const destAbs = resolve(DIST, destRel);
  if (!existsSync(srcAbs)) {
    console.warn("[copy] not found:", srcAbs);
    return;
  }
  mkdirSync(resolve(destAbs, ".."), { recursive: true });
  cpSync(srcAbs, destAbs);
  console.log("[copy]", destRel);
}

/**
 * Custom Vite plugin that:
 * 1. Copies static extension assets (manifest, images, audio)
 * 2. Copies zepto from node_modules to dist/js/lib/
 * 3. Injects zepto <script> tag into the built popup.html
 * 4. Moves the built popup.html from dist/src/popup.html to dist/popup.html
 */
function extensionAssets() {
  return {
    name: "extension-assets",
    writeBundle() {
      copyAsset("manifest.json");
      copyAsset("images");
      copyAsset("audio");

      // Copy zepto from node_modules (loaded as classic <script>, not bundled)
      copyFile(
        resolve(ROOT, "node_modules/zepto/dist/zepto.js"),
        "js/lib/zepto.js",
      );

      // Vite preserves HTML input directory: src/popup.html → dist/src/popup.html
      // Move to dist root + inject zepto <script> before the module bundle
      const htmlSrc = resolve(DIST, "src/popup.html");
      const htmlDest = resolve(DIST, "popup.html");
      if (existsSync(htmlSrc)) {
        let html = readFileSync(htmlSrc, "utf-8");
        html = html.replace(
          '<script type="module"',
          '<script src="js/lib/zepto.js"></script>\n  <script type="module"',
        );
        writeFileSync(htmlDest, html);
        console.log(
          "[copy] moved src/popup.html → popup.html (zepto injected)",
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [extensionAssets()],
  build: {
    outDir: "dist",
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup.html"),
        background: resolve(__dirname, "src/js/background.ts"),
      },
      output: {
        entryFileNames: "js/[name].js",
        chunkFileNames: "js/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
