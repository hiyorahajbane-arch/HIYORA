import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth, useI18n } from '../lib/i18n.jsx'
import { target } from '../lib/content.js'
import { Loading, ErrorState } from '../components/States.jsx'

export default function Progress() {
  const { user, ready } = useAuth()
  const { t, ui } = useI18n()
  const [data, setData] = useState(null)
  const [courses, setCourses] = useState([])
  const [error, setError] = useState(null)

  const load = () => {
    setError(null)
    Promise.all([api.progress(), api.courses()])
      .then(([p, c]) => {
        setData(p)
        setCourses(c.courses)
      })
      .catch(setError)
  }
  useEffect(load, [])

  if (!ready) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (error) return <ErrorState error={error} onRetry={load} />
  if (!data) return <Loading />

  const stats = [
    ['📚', data.lessonsDone, `${t('progress.lessonsDone')} (${t('progress.of')} ${data.lessonsTotal})`],
    ['✏️', data.exercisesAnswered, t('progress.answered')],
    ['🎯', `${data.accuracyPct}%`, t('progress.accuracy')],
    ['🔥', data.streak, t('progress.streak')],
    ['🏆', data.bestStreak, t('progress.best')],
    ['⭐', data.xp, t('progress.xp')],
  ]

  return (
    <div className="page progress-page">
      <h1>{t('progress.title')}</h1>
      <p className="lead">
        {user.name} · {user.dailyGoal} {t('common.minutes')}
      </p>

      <div className="stat-grid">
        {stats.map(([icon, value, label]) => (
          <div key={label} className="card stat">
            <span className="stat-icon" aria-hidden="true">{icon}</span>
            <b>{value}</b>
            <span className="muted small">{label}</span>
          </div>
        ))}
      </div>

      <section className="block">
        <h2>{t('progress.perCourse')}</h2>
        <div className="course-grid">
          {courses.map((c) => {
            const s = data.byCourse[c.id] || { total: 0, done: 0 }
            const pct = s.total ? Math.round((s.done / s.total) * 100) : 0
            return (
              <Link key={c.id} to={`/courses/${c.id}`} className="card course-card" style={{ '--accent': c.color }}>
                <div className="course-top">
                  <span className="flag" aria-hidden="true">{c.flag}</span>
                  <strong>{target(c.name, c.id)}</strong>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <p className="muted small">
                  {pct ? `${pct}% · ${s.done}/${s.total}` : t('progress.notStarted')}
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
