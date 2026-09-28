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
  const [error, setError] = useState(null)

  const load = () => {
    setError(null)
    api.courses().then((r) => setCourses(r.courses)).catch(setError)
  }
  useEffect(load, [])

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
                  {total} {t('common.lessons')}
                </p>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
