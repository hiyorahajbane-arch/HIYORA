import { useCallback, useEffect, useRef, useState } from 'react';
import { api, formatPrice } from '../../api.js';

const empty = { name: '', price: '', oldPrice: '', category: '', gender: '', description: '', image: '', stock: '' };

const GENDERS = [
  { value: '', label: 'للجميع' },
  { value: 'women', label: 'نساء' },
  { value: 'men', label: 'رجال' },
  { value: 'kids', label: 'أطفال' }
];

export function genderLabel(g) {
  const found = GENDERS.find((x) => x.value === g);
  return found ? found.label : 'للجميع';
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

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

  function handleImageFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('الصيغة غير مدعومة — استعمل JPG أو PNG فقط.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة كبير (الحد الأقصى 5MB).');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        setForm((f) => ({ ...f, image: canvas.toDataURL('image/jpeg', 0.82) }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function openEditor(product) {
    setError('');
    setSuccess('');
    if (!product) {
      setForm(empty);
      setEditingId(null);
      return;
    }
    setForm({
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice || '',
      category: product.category || '',
      gender: product.gender || '',
      description: product.description || '',
      image: product.image || '',
      stock: product.stock
    });
    setEditingId(product.id);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = {
        ...form,
        price: Number(form.price) || 0,
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        stock: Number(form.stock) || 0
      };
      if (editingId) {
        await api.products.update(editingId, data);
        setSuccess(`تم حفظ تعديلات "${form.name}" بنجاح ✅`);
      } else {
        await api.products.create(data);
        setSuccess(`تمت إضافة "${form.name}" بنجاح ✅`);
      }
      setForm(empty);
      setEditingId(null);
      await load();
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <form ref={formRef} className={`form admin-form ${editingId ? 'editing' : ''}`} onSubmit={save}>
        <h2 className="form-title">{editingId ? `تعديل المنتج: ${form.name}` : 'إضافة منتج جديد'}</h2>
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
            <label>السعر قبل التخفيض (اختياري)</label>
            <input type="number" min="0" value={form.oldPrice} onChange={set('oldPrice')} placeholder="مثال: 199" />
          </div>
          <div>
            <label>التصنيف</label>
            <input value={form.category} onChange={set('category')} placeholder="مثال: ملابس" />
          </div>
          <div>
            <label>الفئة</label>
            <select value={form.gender} onChange={set('gender')}>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label>المخزون</label>
            <input type="number" min="0" value={form.stock} onChange={set('stock')} />
          </div>
        </div>
        <label>الوصف</label>
        <textarea value={form.description} onChange={set('description')} rows={2} />
        <label>صورة المنتج (JPG / PNG)</label>
        <div className="upload-box">
          {form.image ? (
            <div className="upload-preview">
              <img src={form.image} alt="معاينة الصورة" />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm({ ...form, image: '' })}>
                إزالة الصورة
              </button>
            </div>
          ) : (
            <label className="btn btn-outline upload-btn">
              📤 اختر صورة من جهازك
              <input type="file" accept=".jpg,.jpeg,.png" onChange={handleImageFile} hidden />
            </label>
          )}
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
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
            <th>الفئة</th>
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
              <td>{genderLabel(p.gender)}</td>
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