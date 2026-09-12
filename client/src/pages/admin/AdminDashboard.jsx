import { useEffect, useState } from 'react';
import { api } from '../../api.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.auth.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <div className="muted">جارِ التحميل...</div>;

  const cards = [
    { label: 'المنتجات', value: stats.productCount },
    { label: 'إجمالي الطلبات', value: stats.orderCount },
    { label: 'طلبات قيد الانتظار', value: stats.pendingCount },
    { label: 'إيرادات المبيعات', value: stats.revenue.toLocaleString('ar-EG') + ' ر.س' }
  ];

  return (
    <div>
      <h1>الرئيسية</h1>
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