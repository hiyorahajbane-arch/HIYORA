import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useTranslation } from '../../context/TranslationContext.jsx';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.auth.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <div className="muted">{t('loading')}</div>;

  const cards = [
    { label: t('products'), value: stats.productCount },
    { label: t('totalOrders'), value: stats.orderCount },
    { label: t('pendingOrders'), value: stats.pendingCount },
    { label: t('revenue'), value: new Intl.NumberFormat('fr-MA').format(stats.revenue) + ' DH' }
  ];

  return (
    <div>
      <h1>{t('adminHome')}</h1>
      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <span className="stat-label">{c.label}</span>
            <span className="stat-value">{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}