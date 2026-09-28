import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth, useI18n } from '../lib/i18n.jsx'

const LANGS = [
  { id: 'darija', label: 'Darija' },
  { id: 'ar', label: 'العربية' },
  { id: 'fr', label: 'Français' },
]

export default function Layout({ children }) {
  const { t, ui, setUi, user, logout } = useAuthI18n()
  const navigate = useNavigate()

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">🫖</span>
          <span className="brand-text">
            <strong>{t('brand')}</strong>
            <em>{t('tagline')}</em>
          </span>
        </Link>

        <nav className="nav">
          <NavLink to="/" end>{t('nav.home')}</NavLink>
          <NavLink to="/courses">{t('nav.courses')}</NavLink>
          <NavLink to="/glossary">{t('nav.glossary')}</NavLink>
          {user && <NavLink to="/progress">{t('nav.progress')}</NavLink>}
          <NavLink to="/settings">{t('nav.settings')}</NavLink>
        </nav>

        <div className="topbar-end">
          <div className="lang-picker" role="group" aria-label={t('settings.uiLanguage')}>
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={ui === l.id ? 'on' : ''}
                onClick={() => setUi(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>

          {user ? (
            <div className="user-chip">
              <Link to="/progress" className="user-name">
                <span aria-hidden="true">👤</span> {user.name}
                <span className="user-xp">{user.xp} {t('common.xp')}</span>
              </Link>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                {t('common.logout')}
              </button>
            </div>
          ) : (
            <div className="user-chip">
              <Link className="btn ghost" to="/login">{t('common.login')}</Link>
              <Link className="btn primary" to="/register">{t('common.register')}</Link>
            </div>
          )}
        </div>
      </header>

      <main className="main">{children}</main>

      <footer className="footer">
        <span>{t('brand')}</span>
        <span>{t('tagline')}</span>
      </footer>
    </div>
  )
}

function useAuthI18n() {
  const i18n = useI18n()
  const auth = useAuth()
  return { ...i18n, ...auth }
}
