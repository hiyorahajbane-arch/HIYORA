import { courses as courseMeta } from './courses.js'
import { darijaLessons } from './darija.js'
import { frenchLessons } from './french.js'
import { englishLessons } from './english.js'
import { spanishLessons } from './spanish.js'
import { germanLessons } from './german.js'
import { seedUsers } from './users.js'

/** courseId -> [{ level, label, lessons: [...] }] */
export const courseContent = {
  darija: darijaLessons,
  fr: frenchLessons,
  en: englishLessons,
  es: spanishLessons,
  de: germanLessons,
}

/** Raw metadata, without lesson bodies. */
export { courseMeta }

/**
 * Course metadata with each level carrying its lessons attached, so that
 * `course.levels[].lessons` is a single source of truth for the seeder.
 */
export const courses = courseMeta.map((course) => ({
  ...course,
  levels: course.levels.map((level) => ({
    ...level,
    lessons: (courseContent[course.id] || []).find((b) => b.level === level.level)?.lessons || [],
  })),
}))

/** All lessons, flattened, in course/level/order order. */
export function allLessons() {
  return courses.flatMap((c) =>
    c.levels.flatMap((lvl) => lvl.lessons.map((l) => ({ ...l, courseId: c.id, level: lvl.level }))),
  )
}

export { seedUsers, darijaLessons, frenchLessons, englishLessons, spanishLessons, germanLessons }
