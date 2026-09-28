import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const envFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env')
if (fs.existsSync(envFile)) {
  try {
    process.loadEnvFile(envFile)
  } catch (err) {
    console.warn(`Could not read ${envFile}: ${err.message}`)
  }
}

// Imported after the .env load so JWT_SECRET / PORT are picked up.
const { app } = await import('./app.js')
const { seed } = await import('./seed.js')

const PORT = process.env.PORT || 4000

seed()

app.listen(PORT, () => {
  console.log(`\n  Dariya Academy API  ->  http://localhost:${PORT}\n`)
})
