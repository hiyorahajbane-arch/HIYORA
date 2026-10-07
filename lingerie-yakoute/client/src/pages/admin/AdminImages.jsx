import { useEffect, useState } from 'react';
import { useTranslation } from '../../context/TranslationContext.jsx';
import { DEFAULT_SITE_IMAGES, SITE_IMAGE_KEYS } from '../../siteImages.js';

const LABEL_KEYS = {
  heroHome: 'heroHome',
  heroWomen: 'heroWomen',
  heroMen: 'heroMen',
  heroKids: 'heroKids',
  promo: 'promoImage',
  catWomen: 'catWomen',
  catMen: 'catMen',
  catKids: 'catKids'
};

function resizeImage(file, maxDim = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminImages() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ heroHome: '', heroWomen: '', heroMen: '', heroKids: '', promo: '', catWomen: '', catMen: '', catKids: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('souk_token');
    fetch('/api/settings/site', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const next = {};
        for (const k of SITE_IMAGE_KEYS) next[k] = d?.[k] || '';
        setForm(next);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleFile(key, file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      setError(t('invalidImageFormat'));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(t('imageTooLarge'));
      return;
    }
    setError('');
    try {
      const dataUrl = await resizeImage(file);
      setForm((f) => ({ ...f, [key]: dataUrl }));
    } catch {
      setError(t('invalidImageFormat'));
    }
  }

  async function save(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('souk_token');
      const res = await fetch('/api/settings/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
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
      <h1>{t('siteImagesTitle')}</h1>
      <p className="muted small">{t('siteImagesHint')}</p>
      <form className="form" onSubmit={save}>
        <div className="grid-2">
          {SITE_IMAGE_KEYS.map((key) => (
            <div key={key} className="admin-form" style={{ marginBottom: 0 }}>
              <label>{t(LABEL_KEYS[key])}</label>
              <div className="upload-preview" style={{ marginBottom: 8 }}>
                <img
                  src={form[key] || DEFAULT_SITE_IMAGES[key]}
                  alt={t(LABEL_KEYS[key])}
                  style={{ maxHeight: 120, borderRadius: 12, border: '1px solid var(--border)' }}
                />
              </div>
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={t('imageUrl')}
                dir="ltr"
              />
              <div className="row gap" style={{ marginTop: 8 }}>
                <label className="btn btn-outline btn-sm upload-btn">
                  {t('uploadImage')}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => { handleFile(key, e.target.files?.[0]); e.target.value = ''; }}
                    hidden
                  />
                </label>
                {form[key] && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm({ ...form, [key]: '' })}>
                    {t('reset')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {msg && <div className="alert alert-success">{msg}</div>}
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" disabled={saving}>
            {t('saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}
