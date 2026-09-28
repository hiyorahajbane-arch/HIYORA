import { Router } from 'express'
import fs from 'node:fs'
import { courses } from '../content/index.js'
import { requireAuth } from '../auth.js'
import { LESSONS_FILE, read, update } from '../db.js'
import { isCorrect, isSpokenWell, speechScore } from '../grade.js'

let lessonCache = null
function allLessons() {
  if (lessonCache) return lessonCache
  if (fs.existsSync(LESSONS_FILE)) {
    lessonCache = JSON.parse(fs.readFileSync(LESSONS_FILE, 'utf-8'))
  } else {
    lessonCache = []
  }
  return lessonCache
}

const router = Router()

/** Metadata only — no answers leak. */
const shape = (l) => ({
  id: l.id,
  courseId: l.courseId,
  level: l.level,
  order: l.order,
  title: l.title,
  subtitle: l.subtitle,
  icon: l.icon,
  xp: l.xp,
  duration: l.duration,
  count: (l.exercises || []).length,
  vocabCount: (l.vocab || []).length,
})

router.get('/courses', (_req, res) => {
  const lessons = allLessons()
  res.json({
    courses: courses.map((c) => ({
      id: c.id,
      name: c.name,
      flag: c.flag,
      emoji: c.emoji,
      color: c.color,
      script: c.script,
      levels: c.levels.map((lvl) => ({
        level: lvl.level,
        label: lvl.label,
        count: lessons.filter((l) => l.courseId === c.id && l.level === lvl.level).length,
      })),
    })),
  })
})

router.get('/courses/:courseId', (req, res) => {
  const course = courses.find((c) => c.id === req.params.courseId)
  if (!course) return res.status(404).json({ error: 'اللغة ملقاتش' })
  const lessons = allLessons().filter((l) => l.courseId === course.id)
  res.json({
    course: {
      id: course.id,
      name: course.name,
      flag: course.flag,
      emoji: course.emoji,
      color: course.color,
      description: course.description,
      levels: course.levels.map((lvl) => ({ ...lvl, lessonCount: lessons.filter((l) => l.level === lvl.level).length })),
    },
    lessons: lessons.map(shape),
  })
})

router.get('/lessons/:id', (req, res) => {
  const lesson = allLessons().find((l) => l.id === req.params.id)
  if (!lesson) return res.status(404).json({ error: 'الدرس ملقاتش' })
  const { exercises = [], ...rest } = lesson
  res.json({
    lesson: rest,
    exerciseCount: exercises.length,
    progress: req.user ? read().progress[`${req.user.id}:${lesson.id}`] || null : null,
  })
})

router.get('/lessons/:id/exercises', (req, res) => {
  const lesson = allLessons().find((l) => l.id === req.params.id)
  if (!lesson) return res.status(404).json({ error: 'الدرس ملقاتش' })
  // Grading happens server-side: never ship the expected answer to the client.
  res.json({
    exercises: (lesson.exercises || []).map(({ answer, accept, ...rest }) => rest),
  })
})

router.post('/lessons/:id/answer', requireAuth, (req, res) => {
  const lesson = allLessons().find((l) => l.id === req.params.id)
  if (!lesson) return res.status(404).json({ error: 'الدرس ملقاتش' })

  const { exerciseId, answer } = req.body || {}
  const exercise = (lesson.exercises || []).find((e) => e.id === exerciseId)
  if (!exercise) return res.status(400).json({ error: 'التمرين ملقاتش' })

  let correct = false
  let score = null
  if (exercise.type === 'mcq') {
    correct = Number(answer) === Number(exercise.answer)
  } else if (exercise.type === 'order') {
    const want = exercise.answer.map(normalizeStr).join('|')
    const got = (Array.isArray(answer) ? answer : []).map(normalizeStr).join('|')
    correct = want === got
  } else if (exercise.type === 'speak') {
    score = Math.round(speechScore(answer, exercise) * 100)
    correct = isSpokenWell(answer, exercise)
  } else {
    correct = isCorrect(answer, exercise)
  }

  const key = `${req.user.id}:${lesson.id}`
  const xpGain = correct ? exercise.xp || 10 : 0

  const saved = update((d) => {
    const prev = d.progress[key] || { answers: {}, correct: 0, total: 0, xp: 0, done: false }
    const firstTime = prev.answers[exerciseId] === undefined
    if (firstTime) {
      prev.answers[exerciseId] = correct
      prev.total += 1
      if (correct) prev.correct += 1
      prev.xp += xpGain
    }
    d.progress[key] = prev
    const u = d.users.find((x) => x.id === req.user.id)
    if (u && firstTime) u.xp += xpGain
    return { progress: prev, firstTime, xpGain }
  })

  res.json({
    correct,
    score,
    explanation: exercise.explanation || '',
    // Repeating an exercise is for practice: no second payout.
    xp: saved.firstTime ? saved.xpGain : 0,
    firstTime: saved.firstTime,
    progress: saved.progress,
  })
})

router.post('/lessons/:id/complete', requireAuth, (req, res) => {
  const lesson = allLessons().find((l) => l.id === req.params.id)
  if (!lesson) return res.status(404).json({ error: 'الدرس ملقاتش' })
  const key = `${req.user.id}:${lesson.id}`

  const result = update((d) => {
    const prev = d.progress[key] || { answers: {}, correct: 0, total: 0, xp: 0, done: false }
    const already = prev.done
    prev.done = true
    prev.completedAt = new Date().toISOString()
    d.progress[key] = prev

    const u = d.users.find((x) => x.id === req.user.id)
    let bonus = 0
    if (u && !already) {
      bonus = 20
      u.xp += bonus
      const today = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
      if (u.lastPractice !== today) {
        u.streak = u.lastPractice === yesterday ? (u.streak || 0) + 1 : 1
        u.lastPractice = today
        u.bestStreak = Math.max(u.bestStreak || 0, u.streak)
      }
    }
    return { prev, already, bonus, xp: u?.xp ?? req.user.xp, streak: u?.streak || 0 }
  })

  res.json({ done: true, already: result.already, bonus: result.bonus, streak: result.streak, xp: result.xp, progress: result.prev })
})

router.get('/glossary', (req, res) => {
  const { course, q } = req.query
  let words = allLessons().flatMap((l) =>
    (l.vocab || []).map((v) => ({ ...v, courseId: l.courseId, level: l.level, lessonId: l.id })),
  )
  if (course) words = words.filter((w) => w.courseId === course)
  if (q) {
    const needle = String(q).toLowerCase()
    words = words.filter((w) =>
      [w.word, w.translation?.fr, w.translation?.ar, w.translation?.en, w.translit]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(needle)),
    )
  }
  res.json({ words })
})

router.get('/progress', requireAuth, (req, res) => {
  const db = read()
  const mine = Object.entries(db.progress)
    .filter(([k]) => k.startsWith(`${req.user.id}:`))
    .map(([, v]) => v)
  const lessons = allLessons()
  const doneIds = new Set(Object.keys(db.progress).filter((k) => k.startsWith(`${req.user.id}:`)).map((k) => k.split(':')[1]))
  const byCourse = {}
  let totalXp = 0
  for (const l of lessons) {
    byCourse[l.courseId] = byCourse[l.courseId] || { total: 0, done: 0, xp: 0 }
    byCourse[l.courseId].total += 1
    if (doneIds.has(l.id)) byCourse[l.courseId].done += 1
  }
  for (const p of mine) totalXp += p.xp || 0

  const answered = mine.reduce((s, p) => s + (p.total || 0), 0)
  const correctCount = mine.reduce((s, p) => s + (p.correct || 0), 0)

  res.json({
    xp: req.user.xp,
    streak: req.user.streak,
    bestStreak: req.user.bestStreak,
    dailyGoal: req.user.dailyGoal,
    lessonsDone: doneIds.size,
    lessonsTotal: lessons.length,
    exercisesAnswered: answered,
    accuracy: correctCount,
    accuracyPct: answered ? Math.round((correctCount / answered) * 100) : 0,
    byCourse,
    totalXp,
  })
})

function normalizeStr(s) {
  return String(s || '').toLowerCase().trim()
}

export default router
