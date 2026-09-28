import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth, useI18n } from '../lib/i18n.jsx'
import { gloss, target } from '../lib/content.js'
import { Loading, ErrorState } from '../components/States.jsx'

export default function Courses() {
  const { ui } = useI18n()
  const [courses, setCourses] = useState(null)
  const [error, setError] = useState(null)

  const load = () => {
    setError(null)
    api.courses().then((r) => setCourses(r.courses)).catch(setError)
  }
  useEffect(load, [])

  if (error) return <ErrorState error={error} onRetry={load} />
  if (!courses) return <Loading />

  return (
    <div className="page">
      <h1>{gloss({ darija: 'اللغات لي عندنا', ar: 'اللغات المتاحة', fr: 'Langues disponibles' }, ui)}</h1>
      <div className="course-grid">
        {courses.map((c) => (
          <Link key={c.id} to={`/courses/${c.id}`} className="card course-card" style={{ '--accent': c.color }}>
            <div className="course-top">
              <span className="flag" aria-hidden="true">{c.flag}</span>
              <span className="emoji" aria-hidden="true">{c.emoji}</span>
            </div>
            <h3>{target(c.name, c.id)}</h3>
            <ul className="level-list">
              {c.levels.map((l) => (
                <li key={l.level}>
                  <strong>{l.level}</strong>
                  <span className="muted">{gloss(l.label, ui)}</span>
                  <span className="count">{l.count}</span>
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function CoursePage() {
  const { courseId } = useParams()
  const { t, ui } = useI18n()
  const { user, patch } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const load = () => {
    setError(null)
    api
      .course(courseId)
      .then(setData)
      .catch(setError)
  }
  useEffect(load, [courseId])

  if (error) return <ErrorState error={error} onRetry={load} />
  if (!data) return <Loading />

  const { course, lessons } = data
  const isTarget = user?.targetLanguages?.includes(course.id)
  const total = lessons.length

  return (
    <div className="page course-page" style={{ '--accent': course.color }}>
      <Link className="back" to="/courses">← {t('common.back')}</Link>

      <header className="course-head">
        <span className="flag big" aria-hidden="true">{course.flag}</span>
        <div>
          <h1>{target(course.name, course.id)}</h1>
          <p className="lead">{gloss(course.description, ui)}</p>
        </div>
        {user && (
          <button
            type="button"
            className={`btn ${isTarget ? 'primary' : ''}`}
            onClick={() => {
              const next = user.targetLanguages.includes(course.id)
                ? user.targetLanguages.filter((x) => x !== course.id)
                : [...user.targetLanguages, course.id]
              patch({ targetLanguages: next })
            }}
          >
            {isTarget ? '✓' : '+'} {target(course.name, course.id)}
          </button>
        )}
      </header>

      <p className="muted">
        {total} {t('common.lessons')} ·{' '}
        {lessons.reduce((s, l) => s + (l.count || 0), 0)} {t('course.exercises')}
      </p>

      {course.levels.map((lvl) => {
        const list = lessons.filter((l) => l.level === lvl.level)
        return (
          <section key={lvl.level} className="level-block">
            <h2>
              <span className="badge">{lvl.level}</span> {gloss(lvl.label, ui)}
            </h2>
            {list.length === 0 ? (
              <p className="muted">{t('course.noLessons')}</p>
            ) : (
              <div className="lesson-grid">
                {list.map((l) => (
                  <Link key={l.id} to={`/lessons/${l.id}`} className="card lesson-card">
                    <span className="lesson-icon" aria-hidden="true">{l.icon}</span>
                    <div className="lesson-body">
                      <h3>{target(l.title, course.id)}</h3>
                      <p className="muted small">{gloss(l.subtitle, ui)}</p>
                      <div className="lesson-meta">
                        <span>⏱ {l.duration} {t('common.minutes')}</span>
                        <span>✏️ {l.count} {t('course.exercises')}</span>
                        <span>📖 {l.vocabCount}</span>
                        <span className="xp">+{l.xp} {t('common.xp')}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
