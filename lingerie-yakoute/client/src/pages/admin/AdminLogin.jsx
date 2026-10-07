import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { useTranslation } from '../../context/TranslationContext.jsx';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(false);
    try {
      const res = await api.auth.login(form);
      localStorage.setItem('souk_token', res.token);
      localStorage.setItem('souk_admin', res.username);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container login-wrap">
      <form className="form login-card" onSubmit={submit}>
        <h1>{t('adminLoginTitle')}</h1>
        <p className="muted small">{t('adminLoginSub')}</p>
        <label>{t('username')}</label>
        <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <label>{t('password')}</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? t('submitting') : t('login')}
        </button>
        <p className="muted small center">{t('loginDefault')}</p>
      </form>
    </main>
  );
}