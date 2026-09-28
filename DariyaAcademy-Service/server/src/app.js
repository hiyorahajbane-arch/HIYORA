import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { attachUser } from './auth.js'
import authRoutes from './routes/auth.js'
import contentRoutes from './routes/content.js'
import { seed } from './seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * The client is served from the same origin in production, and from the Vite dev
 * server in development — so only those origins are allowed. Set
 * `CORS_ORIGINS` (comma separated) to widen it for a real deployment.
 */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export function createApp() {
  const app = express()
  app.use(cors({ origin: ALLOWED_ORIGINS }))
  app.use(express.json({ limit: '1mb' }))
  app.use(attachUser)

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'dariya-academy' }))
  app.use('/api/auth', authRoutes)
  app.use('/api', contentRoutes)

  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist')
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist))
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))
  }

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: 'وقع مشكل في السيرفر' })
  })

  return app
}

export const app = createApp()
