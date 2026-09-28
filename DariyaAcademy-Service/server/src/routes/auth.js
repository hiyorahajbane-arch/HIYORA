import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { read, update } from '../db.js'
import { signToken, requireAuth } from '../auth.js'

const router = Router()

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  country: u.country,
  city: u.city,
  nativeLanguage: u.nativeLanguage,
  targetLanguages: u.targetLanguages,
  uiLanguage: u.uiLanguage || 'darija',
  dailyGoal: u.dailyGoal,
  xp: u.xp,
  streak: u.streak,
  bestStreak: u.bestStreak,
  createdAt: u.createdAt,
})

router.post('/register', async (req, res) => {
  const { email, password, name, country, nativeLanguage, targetLanguages, uiLanguage, dailyGoal } = req.body || {}

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'الاسم والإيميل والباسوورد خاصهم' })
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'الباسوورد خاصو 6 حروف على الأقل' })
  }
  const mail = String(email).trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
    return res.status(400).json({ error: 'الإيميل ماشي صحيح' })
  }

  const db = read()
  if (db.users.some((u) => u.email === mail)) {
    return res.status(409).json({ error: 'هاد الإيميل مسجل من قبل' })
  }

  const hash = await bcrypt.hash(String(password), 10)
  const user = {
    id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    email: mail,
    passwordHash: hash,
    name: String(name).trim().slice(0, 60),
    country: country || '',
    city: '',
    nativeLanguage: nativeLanguage || 'darija',
    targetLanguages: Array.isArray(targetLanguages) && targetLanguages.length ? targetLanguages : ['darija', 'fr'],
    uiLanguage: ['darija', 'ar', 'fr'].includes(uiLanguage) ? uiLanguage : 'darija',
    dailyGoal: Number(dailyGoal) > 0 ? Number(dailyGoal) : 10,
    xp: 0,
    streak: 0,
    bestStreak: 0,
    lastPractice: null,
    createdAt: new Date().toISOString(),
  }

  update((d) => d.users.push(user))
  res.status(201).json({ token: signToken(user), user: publicUser(user) })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'الإيميل والباسوورد خاصهم' })

  const mail = String(email).trim().toLowerCase()
  const user = read().users.find((u) => u.email === mail)
  if (!user) return res.status(401).json({ error: 'الإيميل ولا الباسوورد غالط' })

  const ok = await bcrypt.compare(String(password), user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'الإيميل ولا الباسوورد غالط' })

  res.json({ token: signToken(user), user: publicUser(user) })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

router.patch('/me', requireAuth, (req, res) => {
  const allowed = ['name', 'country', 'city', 'nativeLanguage', 'targetLanguages', 'dailyGoal', 'uiLanguage']
  const patch = req.body || {}
  const user = update((d) => {
    const u = d.users.find((x) => x.id === req.user.id)
    for (const key of allowed) {
      if (patch[key] !== undefined) u[key] = patch[key]
    }
    return u
  })
  res.json({ user: publicUser(user) })
})

router.get('/demo', (_req, res) => {
  const user = read().users.find((u) => u.email === 'demo@dariya.academy')
  if (!user) return res.status(404).json({ error: 'حساب الديمو مازال مساجي — شغل: npm run seed --prefix server' })
  res.json({ token: signToken(user), user: publicUser(user) })
})

export default router
export { publicUser }
