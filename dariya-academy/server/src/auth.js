import jwt from 'jsonwebtoken'
import { read } from './db.js'

const SECRET = process.env.JWT_SECRET || 'dariya-academy-dev-secret-change-me'
const TTL = '30d'

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: TTL })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

function readToken(req) {
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) return header.slice(7)
  return null
}

/** populates req.user or leaves it null */
export function attachUser(req, _res, next) {
  const token = readToken(req)
  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      const user = read().users.find((u) => u.id === payload.id)
      if (user) req.user = user
    }
  }
  next()
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'il faut se connecter' })
  next()
}
