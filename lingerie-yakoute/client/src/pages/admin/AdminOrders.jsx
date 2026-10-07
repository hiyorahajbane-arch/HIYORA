import { useEffect, useState } from 'react';
import { api, formatPrice } from '../../api.js';
import { useTranslation } from '../../context/TranslationContext.jsx';

const STATUSES = {
  pending: 'statusPending',
  confirmed: 'statusConfirmed',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
  cancelled: 'statusCancelled'
};

const statusColor = {
  pending: 'chip-orange',
  confirmed: 'chip-blue',
  shipped: 'chip-purple',
  delivered: 'chip-green',
  cancelled: 'chip-red'
};

export default function AdminOrders() {
  const { t, lang } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [productsMap, setProductsMap] = useState({});

  useEffect(() => {
    api.products.list().then(list => {
      const m = {};
      list.forEach(p => m[p.id] = p);
      setProductsMap(m);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    let seen = 0;
    let first = true;
    const load = () => api.orders.list().then((list) => {
      setOrders(list);
      if (!first && list.length > seen) {
        const n = list.length - seen;
        try { new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==').play().catch(()=>{}); } catch {}
        if ('Notification' in window) {
          if (Notification.permission === 'granted') new Notification(`🛒 ${n} طلب جديد!`, { body: `${list[0].customer.name} - ${list[0].total} DH` });
          else if (Notification.permission !== 'denied') Notification.requestPermission();
        }
      }
      seen = list.length;
      first = false;
    }).catch((e) => setError(e.message));
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  async function changeStatus(order, status) {
    try {
      const updated = await api.orders.setStatus(order.id, status);
      setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1>{t('manageOrders')} ({orders.length})</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {orders.length === 0 && <div className="muted">{t('noProductsFound')}</div>}

      <ul className="order-list">
        {orders.map((o) => {
          const open = expanded === o.id;
          return (
            <li key={o.id} className={`order-card ${open ? 'open' : ''}`}>
              <div className="order-head" onClick={() => setExpanded(open ? null : o.id)}>
                <div>
                  <strong>{t('orderIdLabel')} #{o.id}</strong>
                  <span className="muted small"> — {new Date(o.createdAt).toLocaleString(lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr-FR' : 'en-GB')}</span>
                </div>
                <div className="row gap">
                  <span className={`chip status ${statusColor[o.status]}`}>{t(STATUSES[o.status])}</span>
                  <span className="order-total">{formatPrice(o.total)}</span>
                </div>
              </div>

              {open && (
                <div className="order-body">
                  <div className="order-section">
                    <h4>{t('customer')}</h4>
                    <p>{o.customer.name}</p>
                    <p>📞 {o.customer.phone}</p>
                    {o.customer.city && <p>🏙️ {o.customer.city}</p>}
                    {o.customer.address && <p>📍 {o.customer.address}</p>}
                    {o.customer.notes && <p>💬 {o.customer.notes}</p>}
                  </div>
                  <div className="order-section">
                    <h4>{t('productsList')}</h4>
                    {o.items.map((i, idx) => {
                      const p = productsMap[i.productId];
                      const displayName = p ? (p[`name_${lang}`] || p.name) : i.name;
                      return (
                      <div key={`${i.productId}__${i.size || ''}__${idx}`} className="summary-row">
                        <span>{displayName}{i.size ? ` (${t('size')}: ${i.size})` : ''} × {i.qty}</span>
                        <span>{formatPrice(i.price * i.qty)}</span>
                      </div>
                    )})}
                  </div>
                  <div className="order-actions">
                    {Object.entries(STATUSES).map(([key, labelKey]) => (
                      <button
                        key={key}
                        className={`btn btn-sm ${o.status === key ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => changeStatus(o, key)}
                      >
                        {t(labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}