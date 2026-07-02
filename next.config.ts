import type { NextConfig } from 'next'
import fs from 'node:fs'
import path from 'node:path'

// Personal CV data lives in a gitignored `src/lib/seed.local.ts` for local dev.
// It never exists in a fresh clone / CI / production build, so `seed-data`
// falls back to the committed generic placeholder — keeping real data out of
// the public repo, the client bundle, and the prerendered HTML.
const localSeedAbs = path.resolve(process.cwd(), 'src/lib/seed.local.ts')
const hasLocalSeed = fs.existsSync(localSeedAbs)

// Turbopack's `resolveAlias` treats a leading-slash/absolute-path value as a
// server-relative import (unsupported), so it needs a project-root-relative
// path here. Webpack's `resolve.alias`, on the other hand, needs a real
// filesystem absolute path.
const seedTargetRelative = hasLocalSeed ? './src/lib/seed.local.ts' : './src/lib/seed.placeholder.ts'
const seedTargetAbsolute = hasLocalSeed
  ? localSeedAbs
  : path.resolve(process.cwd(), 'src/lib/seed.placeholder.ts')

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      'seed-data': seedTargetRelative,
    },
  },
  webpack: (config) => {
    config.resolve.alias['seed-data'] = seedTargetAbsolute
    return config
  },
}

export default nextConfig
