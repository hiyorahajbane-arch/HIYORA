/**
 * End-to-end API smoke test. Boots the real Express app on an ephemeral port,
 * exercises every endpoint, prints a report and exits with code 1 on failure.
 *
 *   node scripts/smoke.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { app } from '../src/app.js'
import { seed } from '../src/seed.js'

seed({ force: process.argv.includes('--force') })

const server = app.listen(0)
const root = `http://127.0.0.1:${server.address().port}`
const base = `${root}/api`

let pass = 0
const fails = []
async function check(name, fn) {
  try {
    await fn()
    pass++
    console.log(`  ok   ${name}`)
  } catch (err) {
    fails.push(name)
    console.log(`  FAIL ${name}\n       ${err.message}`)
  }
}

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  return { status: res.status, body: json }
}

console.log('\nAPI smoke test\n')

let token = ''
let lessonId = ''
let exercises = []

await check('health', async () => {
  const r = await api('/health')
  assert.equal(r.status, 200)
  assert.equal(r.body.ok, true)
})

await check('courses lists 5 languages with lesson counts', async () => {
  const r = await api('/courses')
  assert.equal(r.status, 200)
  assert.equal(r.body.courses.length, 5)
  for (const c of r.body.courses) {
    assert.ok(c.levels.length >= 1, `${c.id} has no levels`)
    const total = c.levels.reduce((s, l) => s + l.count, 0)
    assert.ok(total > 0, `${c.id} has no lessons`)
    for (const l of c.levels) assert.ok(l.count > 0, `${c.id} ${l.level} count is 0`)
  }
})

await check('course detail returns lessons without answers', async () => {
  const r = await api('/courses/fr')
  assert.equal(r.status, 200)
  assert.ok(r.body.lessons.length >= 5)
  assert.ok(r.body.course.description.fr)
  lessonId = r.body.lessons[0].id
  assert.ok(r.body.lessons.every((l) => l.count > 0))
})

await check('lesson detail hides the exercise list', async () => {
  const r = await api(`/lessons/${lessonId}`)
  assert.equal(r.status, 200)
  assert.equal(r.body.lesson.exercises, undefined)
  assert.ok(r.body.exerciseCount > 0)
  assert.ok(r.body.lesson.sections.length > 0)
  assert.ok(r.body.lesson.vocab.length > 0)
})

await check('exercises never leak the answer key', async () => {
  const r = await api(`/lessons/${lessonId}/exercises`)
  assert.equal(r.status, 200)
  exercises = r.body.exercises
  assert.ok(exercises.length > 0)
  for (const e of exercises) {
    assert.equal(e.answer, undefined, `${e.id} ships an answer`)
    assert.equal(e.accept, undefined, `${e.id} ships accept`)
    assert.ok(e.prompt && e.explanation)
    if (e.type === 'order') assert.ok(Array.isArray(e.tokens) && e.tokens.length, `${e.id} has no token pool`)
  }
})

await check('protected routes reject anonymous callers', async () => {
  assert.equal((await api('/progress')).status, 401)
  assert.equal((await api(`/lessons/${lessonId}/complete`, { method: 'POST' })).status, 401)
  assert.equal(
    (await api(`/lessons/${lessonId}/answer`, { method: 'POST', body: {} })).status,
    401,
  )
})

await check('register creates a usable account', async () => {
  const email = `smoke+${Date.now().toString(36)}@test.dev`
  const r = await api('/auth/register', {
    method: 'POST',
    body: {
      email,
      password: 'smoke123',
      name: 'سلمى',
      country: 'France',
      nativeLanguage: 'darija',
      targetLanguages: ['darija', 'fr'],
      uiLanguage: 'fr',
      dailyGoal: 10,
    },
  })
  assert.equal(r.status, 201)
  assert.ok(r.body.token)
  assert.equal(r.body.user.email, email)
  assert.equal(r.body.user.uiLanguage, 'fr')
  assert.equal(r.body.user.passwordHash, undefined)
  token = r.body.token
})

await check('register rejects a bad email and a short password', async () => {
  assert.equal((await api('/auth/register', { method: 'POST', body: { email: 'nope', password: '123456', name: 'x' } })).status, 400)
  assert.equal((await api('/auth/register', { method: 'POST', body: { email: 'a@b.co', password: '123', name: 'x' } })).status, 400)
})

await check('login works and wrong password is refused', async () => {
  const demo = await api('/auth/login', { method: 'POST', body: { email: 'demo@dariya.academy', password: 'demo1234' } })
  assert.equal(demo.status, 200)
  assert.ok(demo.body.token)
  const bad = await api('/auth/login', { method: 'POST', body: { email: 'demo@dariya.academy', password: 'nope' } })
  assert.equal(bad.status, 401)
})

await check('GET /auth/demo returns the demo account', async () => {
  const r = await api('/auth/demo')
  assert.equal(r.status, 200)
  assert.equal(r.body.user.email, 'demo@dariya.academy')
})

await check('me reads and patches the profile', async () => {
  const me = await api('/auth/me', { token })
  assert.equal(me.status, 200)
  assert.equal(me.body.user.uiLanguage, 'fr')

  const patched = await api('/auth/me', { token, method: 'PATCH', body: { uiLanguage: 'ar', dailyGoal: 25 } })
  assert.equal(patched.status, 200)
  assert.equal(patched.body.user.uiLanguage, 'ar')
  assert.equal(patched.body.user.dailyGoal, 25)

  await api('/auth/me', { token, method: 'PATCH', body: { xp: 999999, passwordHash: 'x' } })
  const after = await api('/auth/me', { token })
  assert.notEqual(after.body.user.xp, 999999, 'patch allowed xp')
  assert.equal(after.body.user.passwordHash, undefined, 'patch allowed passwordHash')
})

await check('answering correctly awards xp once per exercise', async () => {
  const lesson = (await api(`/lessons/${lessonId}`)).body
  const full = JSON.parse(
    (await import('node:fs')).readFileSync(new URL('../data/lessons.json', import.meta.url), 'utf-8'),
  ).find((l) => l.id === lessonId)

  const mcq = full.exercises.find((e) => e.type === 'mcq')
  const good = await api(`/lessons/${lessonId}/answer`, { token, method: 'POST', body: { exerciseId: mcq.id, answer: mcq.answer } })
  assert.equal(good.body.correct, true)
  assert.ok(good.body.xp > 0)
  assert.equal(good.body.firstTime, true)
  assert.ok(good.body.explanation)

  const replay = await api(`/lessons/${lessonId}/answer`, { token, method: 'POST', body: { exerciseId: mcq.id, answer: mcq.answer } })
  assert.equal(replay.body.firstTime, false, 'replay counted twice')
  assert.equal(replay.body.xp, 0, 'replay granted xp')
})

await check('wrong answers are marked wrong and cost nothing', async () => {
  const full = JSON.parse(
    (await import('node:fs')).readFileSync(new URL('../data/lessons.json', import.meta.url), 'utf-8'),
  ).find((l) => l.id === lessonId)
  const fill = full.exercises.find((e) => e.type === 'fill' || e.type === 'translate')
  const r = await api(`/lessons/${lessonId}/answer`, {
    token,
    method: 'POST',
    body: { exerciseId: fill.id, answer: 'definitely-wrong-answer' },
  })
  assert.equal(r.body.correct, false)
  assert.equal(r.body.xp, 0)
})

await check('order exercises are graded by sequence', async () => {
  const full = JSON.parse(
    (await import('node:fs')).readFileSync(new URL('../data/lessons.json', import.meta.url), 'utf-8'),
  ).find((l) => l.id === lessonId)
  const order = full.exercises.find((e) => e.type === 'order')
  if (!order) return
  const okOrder = await api(`/lessons/${lessonId}/answer`, { token, method: 'POST', body: { exerciseId: order.id, answer: order.answer } })
  assert.equal(okOrder.body.correct, true)
  const badOrder = await api(`/lessons/${lessonId}/answer`, { token, method: 'POST', body: { exerciseId: order.id, answer: [...order.answer].reverse() } })
  assert.equal(badOrder.body.correct, false)
  // The tokens the client shuffles must be exactly the answer words.
  assert.deepEqual([...order.tokens].sort(), [...order.answer].sort())
})

await check('speak exercises grade on word overlap, not exact match', async () => {
  const full = JSON.parse(
    (await import('node:fs')).readFileSync(new URL('../data/lessons.json', import.meta.url), 'utf-8'),
  ).find((l) => l.id === lessonId)
  const speak = full.exercises.find((e) => e.type === 'speak')
  if (!speak) return
  // A recognition transcript drops accents and filler words but is otherwise right.
  const messy = speak.audioText.replace(/[éèê]/g, 'e').replace(/\b(the|a)\b/gi, '')
  const good = await api(`/lessons/${lessonId}/answer`, { token, method: 'POST', body: { exerciseId: speak.id, answer: messy } })
  assert.equal(good.body.correct, true, `near-miss rejected (score ${good.body.score}%)`)
  assert.ok(good.body.score > 0 && good.body.score <= 100)

  const bad = await api(`/lessons/${lessonId}/answer`, { token, method: 'POST', body: { exerciseId: speak.id, answer: 'zzz qqq xxx' } })
  assert.equal(bad.body.correct, false)
  assert.equal(bad.body.score, 0)
})

await check('completing a lesson pays the bonus only once', async () => {
  const before = (await api('/auth/me', { token })).body.user.xp
  const first = await api(`/lessons/${lessonId}/complete`, { token, method: 'POST' })
  assert.equal(first.status, 200)
  assert.equal(first.body.done, true)
  assert.equal(first.body.already, false)
  assert.equal(first.body.bonus, 20)
  assert.ok(first.body.streak >= 1)

  const after = (await api('/auth/me', { token })).body.user.xp
  assert.equal(after, before + 20, 'bonus xp not applied')

  const second = await api(`/lessons/${lessonId}/complete`, { token, method: 'POST' })
  assert.equal(second.body.already, true)
  assert.equal(second.body.bonus, 0)
  assert.equal((await api('/auth/me', { token })).body.user.xp, after, 'replay granted xp')
})

await check('progress aggregates what the learner actually did', async () => {
  const r = await api('/progress', { token })
  assert.equal(r.status, 200)
  assert.equal(r.body.lessonsDone, 1)
  assert.equal(r.body.lessonsTotal, 17)
  assert.ok(r.body.exercisesAnswered >= 2)
  assert.equal(typeof r.body.accuracyPct, 'number')
  assert.ok(r.body.byCourse.fr)
  assert.equal(r.body.byCourse.__xp, undefined, 'total xp leaked into byCourse')
})

await check('glossary filters by course and query', async () => {
  const all = await api('/glossary')
  assert.ok(all.body.words.length > 40)
  const de = await api('/glossary?course=de')
  assert.ok(de.body.words.every((w) => w.courseId === 'de'))
  const q = await api('/glossary?course=de&q=schmerz')
  assert.ok(q.body.words.length >= 1)
})

await check('unknown ids return 404', async () => {
  assert.equal((await api('/lessons/nope')).status, 404)
  assert.equal((await api('/courses/nope')).status, 404)
  assert.equal((await api('/lessons/nope/exercises')).status, 404)
})

await check('bad exercise ids return 400', async () => {
  const r = await api(`/lessons/${lessonId}/answer`, { token, method: 'POST', body: { exerciseId: 'nope', answer: 0 } })
  assert.equal(r.status, 400)
})

// --- the built client is served by the same process (npm run build first) ---
const distIndex = fileURLToPath(new URL('../../client/dist/index.html', import.meta.url))
if (fs.existsSync(distIndex)) {
  const html = fs.readFileSync(distIndex, 'utf-8')

  await check('the built SPA is served at the root', async () => {
    const res = await fetch(root)
    assert.equal(res.status, 200)
    assert.match(await res.text(), /id="root"/)
  })

  await check('deep links fall back to index.html', async () => {
    for (const path of ['/courses', '/lessons/fr-a1-1', '/lessons/fr-a1-1/quiz', '/glossary', '/settings']) {
      const res = await fetch(root + path)
      assert.equal(res.status, 200, `${path} -> ${res.status}`)
    }
  })

  await check('hashed assets are served as javascript', async () => {
    const asset = html.match(/\/assets\/index-[^"]+\.js/)[0]
    const res = await fetch(root + asset)
    assert.equal(res.status, 200)
    assert.ok(res.headers.get('content-type').includes('javascript'))
  })

  await check('unknown /api routes are not swallowed by the SPA', async () => {
    assert.equal((await fetch(root + '/api/does-not-exist')).status, 404)
  })
} else {
  console.log('  skip built-client checks (run: npm run build --prefix client)')
}

server.close()
console.log(`\n${pass} passed, ${fails.length} failed\n`)
process.exit(fails.length ? 1 : 0)
