import { useEffect, useState } from 'react';
import { useTranslation } from '../../context/TranslationContext.jsx';
import { SITE_TEXT_KEYS } from '../../siteImages.js';

const FIELDS = [
  { key: 'perk1Title', labelKey: 'perkTitle1', icon: '🚚', defKey: 'freeShipping' },
  { key: 'perk1Text', labelKey: 'perkText1', icon: '🚚', defKey: 'freeShippingText' },
  { key: 'perk2Title', labelKey: 'perkTitle2', icon: '💵', defKey: 'cashOnDelivery' },
  { key: 'perk2Text', labelKey: 'perkText2', icon: '💵', defKey: 'cashOnDeliveryText' },
  { key: 'perk3Title', labelKey: 'perkTitle3', icon: '✨', defKey: 'satisfaction' },
  { key: 'perk3Text', labelKey: 'perkText3', icon: '✨', defKey: 'satisfactionText' }
];

const emptyTexts = () => ({ perk1Title: '', perk1Text: '', perk2Title: '', perk2Text: '', perk3Title: '', perk3Text: '' });

export default function AdminTexts() {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyTexts);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('souk_token');
    fetch('/api/settings/site', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const next = emptyTexts();
        for (const f of FIELDS) next[f.key] = d?.[f.key] || t(f.defKey);
        setForm(next);
        setLoading(false);
      })
      .catch(() => {
        const next = emptyTexts();
        for (const f of FIELDS) next[f.key] = t(f.defKey);
        setForm(next);
        setLoading(false);
      });
  }, []);

  async function save(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('souk_token');
      const current = await fetch('/api/settings/site', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      const res = await fetch('/api/settings/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...(current || {}), ...form })
      });
      if (!res.ok) throw new Error('save failed');
      setMsg(`✅ ${t('saveSuccess')}`);
    } catch {
      setError(t('noProducts'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="muted">{t('loading')}</div>;

  return (
    <div>
      <h1>{t('siteTextsTitle')}</h1>
      <p className="muted small">{t('siteTextsHint')}</p>
      <form className="form admin-form" onSubmit={save}>
        <div className="grid-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label>{f.icon} {t(f.labelKey)}</label>
              <input
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={t(f.defKey)}
              />
              <p className="muted small" style={{ marginTop: 4 }}>{t('defaultLabel')}: {t(f.defKey)}</p>
            </div>
          ))}
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" disabled={saving}>
            {t('saveChanges')}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setForm(emptyTexts())}
          >
            {t('reset')}
          </button>
        </div>
      </form>
    </div>
  );
}
