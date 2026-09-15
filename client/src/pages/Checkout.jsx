import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

export default function Checkout() {
  const { items, total, dispatch } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', city: '', address: '', notes: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <main className="container">
        <h1>إتمام الطلب</h1>
        <p className="muted">سلتك فارغة.</p>
        <Link to="/" className="btn btn-outline">تصفح المنتجات</Link>
      </main>
    );
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.phone.trim()) {
      setError('الاسم ورقم الهاتف مطلوبان.');
      return;
    }
    setSubmitting(true);
    try {
      const order = await api.orders.create({
        customer: form,
        items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty }))
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
      <h1>إتمام الطلب</h1>
      <div className="cart-layout">
        <form className="form" onSubmit={submit}>
          <label>الاسم الكامل *</label>
          <input value={form.name} onChange={set('name')} placeholder="مثال: أحمد محمد" />
          <label>رقم الهاتف *</label>
          <input value={form.phone} onChange={set('phone')} placeholder="05xxxxxxxx" />
          <label>المدينة</label>
          <input value={form.city} onChange={set('city')} />
          <label>العنوان</label>
          <input value={form.address} onChange={set('address')} />
          <label>ملاحظات</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3} />
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'جارِ إرسال الطلب...' : 'تأكيد الطلب'}
          </button>
        </form>
        <aside className="summary">
          <h3>ملخص الطلب</h3>
          {items.map((i) => (
            <div key={i.id} className="summary-row">
              <span>{i.name} × {i.qty}</span>
              <span>{formatPrice(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="summary-row total"><span>الإجمالي</span><span>{formatPrice(total)}</span></div>
          <p className="muted small">الدفع عند الاستلام — الدّيهم المغربي (DH)</p>
        </aside>
      </div>
    </main>
  );
}