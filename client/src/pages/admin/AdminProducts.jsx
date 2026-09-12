import { useCallback, useEffect, useState } from 'react';
import { api, formatPrice } from '../../api.js';

const empty = { name: '', price: '', category: '', description: '', image: '', stock: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setProducts(await api.products.list());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function openEditor(product) {
    if (!product) {
      setForm(empty);
      setEditingId(null);
      return;
    }
    setForm({
      name: product.name,
      price: product.price,
      category: product.category || '',
      description: product.description || '',
      image: product.image || '',
      stock: product.stock
    });
    setEditingId(product.id);
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = {
        ...form,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0
      };
      if (editingId) await api.products.update(editingId, data);
      else await api.products.create(data);
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(product) {
    if (!confirm(`حذف المنتج "${product.name}"؟`)) return;
    try {
      await api.products.remove(product.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>إدارة المنتجات</h1>
      <form className="form admin-form" onSubmit={save}>
        <div className="grid-2">
          <div>
            <label>اسم المنتج *</label>
            <input value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label>السعر (ر.س) *</label>
            <input type="number" min="0" value={form.price} onChange={set('price')} required />
          </div>
          <div>
            <label>التصنيف</label>
            <input value={form.category} onChange={set('category')} placeholder="مثال: إلكترونيات" />
          </div>
          <div>
            <label>المخزون</label>
            <input type="number" min="0" value={form.stock} onChange={set('stock')} />
          </div>
        </div>
        <label>الوصف</label>
        <textarea value={form.description} onChange={set('description')} rows={2} />
        <label>رابط الصورة</label>
        <input value={form.image} onChange={set('image')} placeholder="https://..." />
        {error && <div className="alert alert-error">{error}</div>}
        <div className="row">
          <button className="btn btn-primary" disabled={loading}>
            {editingId ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={() => openEditor(null)}>
              إلغاء
            </button>
          )}
        </div>
      </form>

      <h2 className="mt">المنتجات الحالية ({products.length})</h2>
      <table className="table">
        <thead>
          <tr>
            <th>الصورة</th>
            <th>الاسم</th>
            <th>التصنيف</th>
            <th>السعر</th>
            <th>المخزون</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="thumb"
                    onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                  />
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>{p.name}</td>
              <td>{p.category || '—'}</td>
              <td>{formatPrice(p.price)}</td>
              <td>{p.stock}</td>
              <td className="row gap">
                <button className="btn btn-outline btn-sm" onClick={() => openEditor(p)}>تعديل</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}