/**
 * Checks the Vite dev server: it must serve the SPA, transform JSX, and proxy
 * /api to the Express app. Self contained - it boots the API in-process on an
 * ephemeral port and passes that port to Vite, so it never collides with a
 * server you already have running.
 *
 *   node scripts/check-dev-client.mjs
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { seed } from '../src/seed.js'

const serverDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const clientDir = path.join(serverDir, '..', 'client')

seed()
const api = createApp().listen(0)
await new Promise((resolve, reject) => {
  api.once('listening', resolve)
  api.once('error', reject)
})
const apiPort = api.address().port
const webPort = 4113
const url = `http://localhost:${webPort}`

const vite = spawn('node', ['node_modules/vite/bin/vite.js', '--port', String(webPort), '--strictPort'], {
  cwd: clientDir,
  env: { ...process.env, PORT: String(apiPort) },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let log = ''
vite.stdout.on('data', (d) => (log += d))
vite.stderr.on('data', (d) => (log += d))

const shutdown = () => {
  vite.kill()
  api.close()
}
process.on('exit', shutdown)

async function waitFor(fn, label, ms = 30000) {
  const started = Date.now()
  for (;;) {
    try {
      return await fn()
    } catch (err) {
      if (Date.now() - started > ms) throw new Error(`${label}: ${err.message}\n${log}`)
      await new Promise((r) => setTimeout(r, 400))
    }
  }
}

let failures = 0
const check = (name, fn) =>
  Promise.resolve()
    .then(fn)
    .then(() => console.log(`  ok   ${name}`))
    .catch((err) => {
      failures++
      console.log(`  FAIL ${name}\n       ${err.message}`)
    })

try {
  await waitFor(async () => {
    const res = await fetch(`http://localhost:${apiPort}/api/health`)
    assert.equal(res.status, 200)
  }, 'the API never came up')

  await waitFor(async () => {
    const res = await fetch(url)
    assert.equal(res.status, 200)
  }, 'vite never came up')

  await check('serves the SPA at the root', async () => {
    const html = await (await fetch(url)).text()
    assert.match(html, /id="root"/)
    assert.match(html, /\/src\/main.jsx/)
  })

  await check('serves a deep link as the SPA', async () => {
    const res = await fetch(`${url}/lessons/darija-a1-1`)
    assert.equal(res.status, 200)
    assert.match(await res.text(), /id="root"/)
  })

  await check('transforms JSX on the fly', async () => {
    const js = await (await fetch(`${url}/src/pages/Quiz.jsx`)).text()
    // A raw file would still contain JSX tags and JSX runtime imports.
    assert.ok(!js.includes('<OrderInput'), 'JSX was not transformed')
    assert.ok(!js.includes('from "react/jsx-runtime"'), 'JSX runtime import was left untransformed')
    assert.match(js, /jsxDEV|jsxRuntime|jsx\(/, 'no compiled JSX found in the output')
  })

  await check('proxies /api to the Express server', async () => {
    const res = await fetch(`${url}/api/health`)
    assert.equal(res.status, 200)
    assert.equal((await res.json()).ok, true)
  })

  await check('proxies content API calls too', async () => {
    const res = await fetch(`${url}/api/courses/fr`)
    assert.equal(res.status, 200)
    const data = await res.json()
    assert.ok(data.lessons.length > 0)
  })

  await check('still guards authenticated routes through the proxy', async () => {
    const res = await fetch(`${url}/api/progress`)
    assert.equal(res.status, 401)
  })
} finally {
  shutdown()
}

console.log(failures ? `\n${failures} dev-client check(s) failed\n` : '\ndev client ok\n')
process.exit(failures ? 1 : 0)
