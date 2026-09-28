import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useI18n } from '../lib/i18n.jsx'
import { api } from '../lib/api.js'

const LANGS = [
  { id: 'darija', flag: '🇲🇦', name: 'الدارجة' },
  { id: 'fr', flag: '🇫🇷', name: 'Français' },
  { id: 'en', flag: '🇬🇧', name: 'English' },
  { id: 'es', flag: '🇪🇸', name: 'Español' },
  { id: 'de', flag: '🇩🇪', name: 'Deutsch' },
]

const COUNTRIES = ['France', 'Belgique', 'Canada', 'Espagne', 'Allemagne', 'Maroc', 'Italie', 'Pays-Bas', 'Autre']

export default function Auth({ mode = 'login' }) {
  const isLogin = mode === 'login'
  const { t, ui, setUi } = useI18n()
  const { login, register, demo } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    country: 'France',
    dailyGoal: 10,
    targetLanguages: ['darija', 'fr'],
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleLang = (id) =>
    setForm((f) => ({
      ...f,
      targetLanguages: f.targetLanguages.includes(id)
        ? f.targetLanguages.filter((x) => x !== id)
        : [...f.targetLanguages, id],
    }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (isLogin) await login(form.email, form.password)
      else {
        await register({
          email: form.email,
          password: form.password,
          name: form.name,
          country: form.country,
          dailyGoal: Number(form.dailyGoal) || 10,
          targetLanguages: form.targetLanguages,
          uiLanguage: ui,
        })
      }
      navigate('/courses')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const onDemo = async () => {
    setBusy(true)
    setError(null)
    try {
      await demo()
      navigate('/courses')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="auth-head">
          <span className="brand-mark" aria-hidden="true">🫖</span>
          <h1>{isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}</h1>
          <p className="muted">{t('auth.welcome')}</p>
        </div>

        <form onSubmit={onSubmit} className="form">
          {!isLogin && (
            <label>
              <span>{t('auth.name')}</span>
              <input value={form.name} onChange={set('name')} required autoComplete="name" />
            </label>
          )}

          <label>
            <span>{t('auth.email')}</span>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
              dir="ltr"
            />
          </label>

          <label>
            <span>{t('auth.password')}</span>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              dir="ltr"
            />
          </label>

          {!isLogin && (
            <>
              <label>
                <span>{t('auth.country')}</span>
                <select value={form.country} onChange={set('country')}>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>{t('auth.goal')}</span>
                <input
                  type="number"
                  min="5"
                  max="120"
                  step="5"
                  value={form.dailyGoal}
                  onChange={set('dailyGoal')}
                />
              </label>

              <fieldset>
                <legend>{t('auth.target')}</legend>
                <div className="chips">
                  {LANGS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      className={`chip ${form.targetLanguages.includes(l.id) ? 'on' : ''}`}
                      onClick={() => toggleLang(l.id)}
                    >
                      <span aria-hidden="true">{l.flag}</span> {l.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {error && <p className="form-error">⚠️ {error.message}</p>}

          <button className="btn primary big" type="submit" disabled={busy}>
            {isLogin ? t('common.login') : t('common.register')}
          </button>
        </form>

        <div className="auth-alt">
          <button type="button" className="btn" onClick={onDemo} disabled={busy}>
            {t('common.demo')}
          </button>
          <p className="muted small">{t('auth.tryDemo')}</p>
        </div>

        <p className="auth-switch">
          {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
          <Link to={isLogin ? '/register' : '/login'}>
            {isLogin ? t('common.register') : t('common.login')}
          </Link>
        </p>
      </div>

      <div className="auth-side">
        <button type="button" className="link" onClick={() => setUi(ui === 'fr' ? 'darija' : 'fr')}>
          {ui === 'fr' ? 'العربية / Darija' : 'Français'}
        </button>
      </div>
    </div>
  )
}
