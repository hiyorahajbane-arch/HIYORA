import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext.jsx';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('souk_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.ok) setAuthed(true);
        else localStorage.removeItem('souk_token');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container muted">{t('loading')}</div>;
  if (!authed) return <Navigate to="/admin/login" replace />;

  const logout = () => {
    localStorage.removeItem('souk_token');
    localStorage.removeItem('souk_admin');
    navigate('/admin/login');
  };

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <h2>HIYORA</h2>
        <NavLink to="/admin" end>{t('adminHome')}</NavLink>
        <NavLink to="/admin/products">{t('adminProducts')}</NavLink>
        <NavLink to="/admin/orders">{t('adminOrders')}</NavLink>
        <NavLink to="/admin/settings">⚙️ واتساب</NavLink>
        <button onClick={logout} className="btn btn-outline btn-sm">{t('logout')}</button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}