#!/usr/bin/env bash
#
# Packages the built extension for the Chrome Web Store.
#
# Run it through `npm run deploy`, which lints, type-checks, tests and builds
# first. The ZIP holds the *contents* of `dist/`, so `manifest.json` sits at its
# root — the Web Store rejects an archive that nests the extension in a folder.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"
OUT_DIR="$ROOT/dashboard/package"

if [[ ! -f "$DIST/manifest.json" ]]; then
    echo "package: nothing built in dist/ — run 'npm run build' first" >&2
    exit 1
fi

VERSION="$(node -p "JSON.parse(require('node:fs').readFileSync('$ROOT/src/manifest.json', 'utf8')).version")"
OUTPUT="$OUT_DIR/1-click-timer-$VERSION.zip"

mkdir -p "$OUT_DIR"
rm -f "$OUTPUT"

if command -v zip >/dev/null 2>&1; then
    (cd "$DIST" && zip -qr "$OUTPUT" .)
else
    # No zip(1) on this machine, so fall back to Python's standard library. Paths
    # are stored relative to dist/ so the archive has no leading directory.
    python3 - "$DIST" "$OUTPUT" <<'PYTHON'
import os
import sys
import zipfile

source, target = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
    for root, _dirs, files in os.walk(source):
        for name in sorted(files):
            path = os.path.join(root, name)
            archive.write(path, os.path.relpath(path, source))
PYTHON
fi

if [[ ! -s "$OUTPUT" ]]; then
    echo "package: failed to write $OUTPUT" >&2
    exit 1
fi

echo "package: 1-click-timer $VERSION → $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
