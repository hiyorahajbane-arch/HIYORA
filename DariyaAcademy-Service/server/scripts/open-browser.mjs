/**
 * Waits until the local site answers, then opens it in the default browser.
 * Uses `cmd.exe /c start` which is the most reliable way on Windows.
 * Detached, so the server window keeps serving.
 *
 *   node scripts/open-browser.mjs http://localhost:5173 5173
 */
import { spawn } from 'node:child_process'
import process from 'node:process'

const [url, rawPort] = process.argv.slice(2)
if (!url) {
  console.error('usage: node scripts/open-browser.mjs <url> [port]')
  process.exit(1)
}

const port = Number(rawPort) || Number(new URL(url).port) || (url.includes('5173') ? 5173 : 4000)
const timeoutMs = Number(process.env.OPEN_TIMEOUT_MS) || 60000
const deadline = Date.now() + timeoutMs

async function isUp() {
  for (const host of ['127.0.0.1', 'localhost']) {
    try {
      const res = await fetch(`http://${host}:${port}/`, { redirect: 'manual' })
      if (res.status < 500) return true
    } catch {
      /* not listening yet */
    }
  }
  return false
}

let ready = false
while (Date.now() < deadline) {
  if (await isUp()) {
    ready = true
    break
  }
  await new Promise((r) => setTimeout(r, 400))
}

if (!ready) {
  console.error(`[open-browser] ${url} did not answer within ${timeoutMs}ms - not opening.`)
  process.exit(0)
}

if (process.env.DRY_RUN) {
  console.log(`[open-browser] ${url} is up (dry run, browser not launched).`)
  process.exit(0)
}

// The empty string is the window title; without it cmd treats the URL as the title.
const child = spawn('cmd.exe', ['/c', 'start', '', url], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true,
})
child.unref()
console.log(`[open-browser] ${url} is up, browser requested.`)
