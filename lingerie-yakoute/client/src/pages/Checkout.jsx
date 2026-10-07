import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useTranslation } from '../context/TranslationContext.jsx';

export default function Checkout() {
  const { items, total, dispatch } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', phone: '', city: '', address: '', notes: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <main className="container">
        <h1>{t('checkoutTitle')}</h1>
        <p className="muted">{t('emptyCart')}</p>
        <Link to="/" className="btn btn-outline">{t('continueShopping')}</Link>
      </main>
    );
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const order = await api.orders.create({
        customer: form,
        items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, size: i.size || '' }))
      });
      dispatch({ type: 'clear' });
      navigate(`/order-success/${order.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="container checkout">
      <h1>{t('checkoutTitle')}</h1>
      <div className="cart-layout">
        <form className="form" onSubmit={submit}>
          <label>{t('fullName')} *</label>
          <input value={form.name} onChange={set('name')} placeholder="مثال: أحمد محمد" />
          <label>{t('phone')} *</label>
          <input value={form.phone} onChange={set('phone')} placeholder="05xxxxxxxx" />
          <label>{t('city')}</label>
          <input value={form.city} onChange={set('city')} />
          <label>{t('address')}</label>
          <input value={form.address} onChange={set('address')} />
          <label>{t('notes')}</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3} />
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? t('submitting') : t('confirmOrder')}
          </button>
        </form>
        <aside className="summary">
          <h3>{t('orderSummary')}</h3>
          {items.map((i) => (
            <div key={i.key || `${i.id}__${i.size || ''}`} className="summary-row">
              <span>{i.name}{i.size ? ` (${t('size')}: ${i.size})` : ''} × {i.qty}</span>
              <span>{formatPrice(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="summary-row total"><span>{t('total')}</span><span>{formatPrice(total)}</span></div>
          <p className="muted small">{t('cod')}</p>
        </aside>
      </div>
    </main>
  );
}