import { useEffect, useState } from 'react';
import { api, formatPrice } from '../../api.js';

const STATUSES = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي'
};

const statusColor = {
  pending: 'chip-orange',
  confirmed: 'chip-blue',
  shipped: 'chip-purple',
  delivered: 'chip-green',
  cancelled: 'chip-red'
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.orders.list().then(setOrders).catch((e) => setError(e.message));
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
      <h1>إدارة الطلبات ({orders.length})</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {orders.length === 0 && <div className="muted">لا توجد طلبات بعد.</div>}

      <ul className="order-list">
        {orders.map((o) => {
          const open = expanded === o.id;
          return (
            <li key={o.id} className={`order-card ${open ? 'open' : ''}`}>
              <div className="order-head" onClick={() => setExpanded(open ? null : o.id)}>
                <div>
                  <strong>طلب #{o.id}</strong>
                  <span className="muted small"> — {new Date(o.createdAt).toLocaleString('ar')}</span>
                </div>
                <div className="row gap">
                  <span className={`chip status ${statusColor[o.status]}`}>{STATUSES[o.status]}</span>
                  <span className="order-total">{formatPrice(o.total)}</span>
                </div>
              </div>

              {open && (
                <div className="order-body">
                  <div className="order-section">
                    <h4>العميل</h4>
                    <p>{o.customer.name}</p>
                    <p>📞 {o.customer.phone}</p>
                    {o.customer.city && <p>🏙️ {o.customer.city}</p>}
                    {o.customer.address && <p>📍 {o.customer.address}</p>}
                    {o.customer.notes && <p>💬 {o.customer.notes}</p>}
                  </div>
                  <div className="order-section">
                    <h4>المنتجات</h4>
                    {o.items.map((i) => (
                      <div key={i.productId} className="summary-row">
                        <span>{i.name} × {i.qty}</span>
                        <span>{formatPrice(i.price * i.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-actions">
                    {Object.entries(STATUSES).map(([key, label]) => (
                      <button
                        key={key}
                        className={`btn btn-sm ${o.status === key ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => changeStatus(o, key)}
                      >
                        {label}
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