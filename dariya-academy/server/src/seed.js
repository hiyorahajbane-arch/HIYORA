import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DB_FILE, DATA_DIR, LESSONS_FILE, read, write } from './db.js'
import { seedUsers, courses, allLessons } from './content/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function buildLessons() {
  const seen = new Set()
  for (const course of courses) {
    for (const level of course.levels) {
      if (!level.lessons.length) {
        console.warn(`تحذير: الكورس ${course.id} فيه المستوى ${level.level} بلا دروس`)
      }
      for (const lesson of level.lessons) {
        if (seen.has(lesson.id)) throw new Error(`معرف درس مكرر: ${lesson.id}`)
        seen.add(lesson.id)
      }
    }
  }
  return allLessons()
}

function writeLessons() {
  const lessons = buildLessons()
  fs.writeFileSync(LESSONS_FILE, JSON.stringify(lessons, null, 2), 'utf-8')
  return lessons.length
}

/**
 * @param {{force?: boolean}} opts
 *   force = wipe the database and start from the seed accounts.
 *   Lessons are always regenerated so content edits show up without a wipe.
 */
export function seed({ force = false } = {}) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

  const lessonCount = writeLessons()

  if (!fs.existsSync(DB_FILE) || force) {
    write({ users: seedUsers, progress: {} })
    return { skipped: false, file: DB_FILE, users: seedUsers.length, lessons: lessonCount }
  }
  return { skipped: true, file: DB_FILE, lessons: lessonCount }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const force = process.argv.includes('--force')
  const res = seed({ force })
  console.log(
    res.skipped
      ? `الداتابيز موجودة (استعملو --force باش تعاود التهيئة) — ${res.lessons} درس مجدد`
      : `تمت التهيئة: ${res.users} مستخدمين و ${res.lessons} درس`,
  )
}
