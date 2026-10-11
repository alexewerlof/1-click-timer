import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The manifest and `package.json` describe one extension, so the fields that can
 * match must match: the version is what Chrome and the Web Store compare against
 * the published release, and the description is the short description users
 * search on. Diverging is silent otherwise — the build copies the manifest
 * verbatim, so nobody notices until the store rejects the upload.
 *
 * `author` is deliberately not compared: Chrome dropped the manifest key in
 * February 2024 and now ignores it, so the author lives only in `package.json`.
 */

/** The Web Store's limit for the short description, which the manifest carries. */
const SHORT_DESCRIPTION_MAX = 132

/** A version Chrome accepts: one to four dot-separated numbers. */
const CHROME_VERSION = /^\d+(\.\d+){0,3}$/

interface Manifest {
    name: string
    version: string
    description: string
}

interface PackageJson {
    name: string
    version: string
    description: string
}

const SRC_DIR = dirname(fileURLToPath(import.meta.url))

function readJson<T>(path: string): T {
    return JSON.parse(readFileSync(path, 'utf8')) as T
}

/** npm forbids spaces in a package name, so `1-click timer` ↔ `1-click-timer`. */
function normalizeName(name: string): string {
    return name.replaceAll(' ', '-').toLowerCase()
}

const manifest = readJson<Manifest>(resolve(SRC_DIR, 'manifest.json'))
const pkg = readJson<PackageJson>(resolve(SRC_DIR, '..', 'package.json'))

describe('manifest.json and package.json agree', () => {
    it('name the same extension', () => {
        expect(normalizeName(manifest.name)).toBe(normalizeName(pkg.name))
    })

    it('carry the same version', () => {
        expect(manifest.version).toBe(pkg.version)
    })

    it('carry the same description', () => {
        expect(manifest.description).toBe(pkg.description)
    })

    it('keep the shared description inside the store limit', () => {
        expect(manifest.description.length).toBeLessThanOrEqual(SHORT_DESCRIPTION_MAX)
    })

    it('use a version Chrome accepts', () => {
        expect(manifest.version).toMatch(CHROME_VERSION)
    })
})
