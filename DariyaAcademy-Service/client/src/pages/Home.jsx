import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useAuth, useI18n } from '../lib/i18n.jsx'
import { target } from '../lib/content.js'
import { Loading, ErrorState } from '../components/States.jsx'

export default function Home() {
  const { t, ui } = useI18n()
  const { user } = useAuth()
  const [courses, setCourses] = useState(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)

  const load = () => {
    setError(null)
    Promise.all([api.courses(), user ? api.progress() : Promise.resolve(null)])
      .then(([c, p]) => {
        setCourses(c.courses)
        setProgress(p)
      })
      .catch(setError)
  }
  useEffect(load, [user?.id])

  if (error) return <ErrorState error={error} onRetry={load} />
  if (!courses) return <Loading />

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>{t('home.heroTitle')}</h1>
          <p className="lead">{t('home.heroText')}</p>
          <div className="cta-row">
            <Link className="btn primary big" to={user ? '/courses' : '/register'}>
              {t('home.cta')}
            </Link>
            <Link className="btn big" to="/courses">
              {t('home.ctaSecondary')}
            </Link>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="bubble b1">السلام عليكم</div>
          <div className="bubble b2">Bonjour !</div>
          <div className="bubble b3">Hola 👋</div>
          <div className="bubble b4">Guten Tag</div>
        </div>
      </section>

      {user && progress && (
        <section className="learning-resume card">
          <div className="resume-copy">
            <span className="eyebrow">{t('home.welcomeBack', { name: user.name })}</span>
            <h2>{progress.nextLesson ? t('home.nextLesson') : t('home.allDone')}</h2>
            <p className="muted">
              {progress.nextLesson
                ? `${target(progress.nextLesson.title, progress.nextLesson.courseId)} · ${target(courses.find((c) => c.id === progress.nextLesson.courseId)?.name, progress.nextLesson.courseId)}`
                : t('home.allDoneText')}
            </p>
          </div>
          {progress.nextLesson ? (
            <Link className="btn primary" to={`/lessons/${progress.nextLesson.id}`}>
              {t('home.resume')} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <Link className="btn primary" to="/courses">{t('home.explore')}</Link>
          )}
        </section>
      )}

      <section className="why">
        <h2>{t('home.whyTitle')}</h2>
        <div className="why-grid">
          {t('home.why').map(([icon, title, body]) => (
            <article key={title} className="card why-card">
              <span className="why-icon" aria-hidden="true">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="courses-preview">
        <h2>{t('home.pickLanguage')}</h2>
        <div className="course-grid">
          {courses.map((c) => {
            const total = c.levels.reduce((s, l) => s + l.count, 0)
            return (
              <Link key={c.id} to={`/courses/${c.id}`} className="card course-card" style={{ '--accent': c.color }}>
                <div className="course-top">
                  <span className="flag" aria-hidden="true">{c.flag}</span>
                  <span className="emoji" aria-hidden="true">{c.emoji}</span>
                </div>
                <h3>{target(c.name, c.id)}</h3>
                <p className="muted">
                  {progress?.byCourse?.[c.id]?.done || 0} / {total} {t('common.lessons')}
                </p>
                {progress && <div className="progress-track" aria-label={`${progress.byCourse?.[c.id]?.done || 0} / ${total}`}>
                  <div className="progress-fill" style={{ width: `${total ? Math.round(((progress.byCourse?.[c.id]?.done || 0) / total) * 100) : 0}%` }} />
                </div>}
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
