import { useState } from 'react'
import { useAuth, useI18n } from '../lib/i18n.jsx'
import { recognitionSupported, speechSupported } from '../lib/speech.js'

const UI_TEXT = {
  name: { darija: 'السمية', ar: 'الاسم', fr: 'Nom' },
  country: { darija: 'البلد', ar: 'البلد', fr: 'Pays' },
  goal: { darija: 'الهدف ديالك فـ النهار (دقايق)', ar: 'الهدف اليومي (بالدقائق)', fr: 'Objectif quotidien (minutes)' },
}

export default function Settings() {
  const { t, ui, setUi, langs, theme, setTheme } = useI18n()
  const { user, patch, logout } = useAuth()
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async (body) => {
    setBusy(true)
    setSaved(false)
    try {
      await patch(body)
      setSaved(true)
      setTimeout(() => setSaved(false), 1600)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page settings-page">
      <h1>{t('settings.title')}</h1>

      <section className="card settings-block">
        <h2>{t('settings.uiLanguage')}</h2>
        <p className="muted small">{t('settings.langNote')}</p>
        <div className="chips">
          {langs.map((l) => (
            <button key={l} type="button" className={`chip ${ui === l ? 'on' : ''}`} onClick={() => setUi(l)}>
              {l === 'darija' ? 'Darija' : l === 'ar' ? 'العربية' : 'Français'}
            </button>
          ))}
        </div>
      </section>

      <section className="card settings-block">
        <h2>{t('settings.theme')}</h2>
        <div className="chips">
          <button type="button" className={`chip ${theme === 'light' ? 'on' : ''}`} onClick={() => setTheme('light')}>
            ☀️ {t('settings.light')}
          </button>
          <button type="button" className={`chip ${theme === 'dark' ? 'on' : ''}`} onClick={() => setTheme('dark')}>
            🌙 {t('settings.dark')}
          </button>
        </div>
      </section>

      {user && (
        <section className="card settings-block">
          <h2>{t('settings.account')}</h2>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              save({
                name: e.target.name.value,
                country: e.target.country.value,
                dailyGoal: Number(e.target.dailyGoal.value) || 10,
              })
            }}
          >
            <label>
              <span>{UI_TEXT.name[ui]}</span>
              <input name="name" defaultValue={user.name} />
            </label>
            <label>
              <span>{UI_TEXT.country[ui]}</span>
              <input name="country" defaultValue={user.country || ''} dir="ltr" />
            </label>
            <label>
              <span>{UI_TEXT.goal[ui]}</span>
              <input name="dailyGoal" type="number" min="5" max="120" step="5" defaultValue={user.dailyGoal} />
            </label>
            <p className="muted small">{user.email}</p>
            <button className="btn primary" type="submit" disabled={busy}>
              {saved ? '✓' : t('common.save')}
            </button>
          </form>
        </section>
      )}

      <section className="card settings-block">
        <h2>🔊 / 🎙</h2>
        <p className="muted small">
          TTS: {speechSupported ? '✓' : '✗'} · STT: {recognitionSupported ? '✓' : '✗'}
        </p>
      </section>

      {user && (
        <section className="card settings-block danger">
          <h2>{t('settings.danger')}</h2>
          <button type="button" className="btn" onClick={logout}>
            {t('common.logout')}
          </button>
        </section>
      )}
    </div>
  )
}
