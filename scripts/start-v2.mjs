// Starter den nye nettsiden (nettside-v2: Next.js + Payload) med en lokal SQLite-database.
// Brukes av `npm start` og `npm run dev` i rotmappen, blant annet i Google AI Studio.
// Den gamle MVP-en kan fortsatt startes med `npm run start:mvp`.
//
// Første start: installerer avhengigheter, lager og fyller databasen med mockdata,
// og bygger appen. Senere starter hopper over det som allerede er gjort.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const app = path.join(rot, 'nettside-v2')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const port = process.env.PORT || '3000'
const harPostgres = (process.env.DATABASE_URL || '').startsWith('postgres')

function kjor(kommando, args, env = {}) {
  console.log(`\n> ${kommando} ${args.join(' ')}`)
  const r = spawnSync(kommando, args, {
    cwd: app,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    // .cmd-filer (npm på Windows) må kjøres via shell; node.exe med mellomrom i stien skal ikke det.
    shell: kommando.endsWith('.cmd'),
  })
  if (r.status !== 0) {
    console.error(`Feilet: ${kommando} ${args.join(' ')} (kode ${r.status})`)
    process.exit(r.status ?? 1)
  }
}

const nextBin = path.join(app, 'node_modules', 'next', 'dist', 'bin', 'next')

if (!existsSync(nextBin)) {
  // --include=dev: seed og bygg trenger tsx og typescript, også når NODE_ENV=production.
  kjor(npm, ['install', '--include=dev', '--no-audit', '--no-fund'])
}

if (!harPostgres && !existsSync(path.join(app, 'data', 'nettside.db'))) {
  kjor(npm, ['run', 'seed'], { NODE_OPTIONS: '--no-deprecation' })
}

if (!existsSync(path.join(app, '.next', 'BUILD_ID'))) {
  kjor(process.execPath, [nextBin, 'build'], {
    NODE_OPTIONS: '--no-deprecation --max-old-space-size=4096',
  })
}

console.log(`\nStarter nettsiden på http://0.0.0.0:${port}`)
const server = spawn(process.execPath, [nextBin, 'start', '-H', '0.0.0.0', '-p', port], {
  cwd: app,
  stdio: 'inherit',
  env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
})
server.on('exit', (kode) => process.exit(kode ?? 0))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal))
