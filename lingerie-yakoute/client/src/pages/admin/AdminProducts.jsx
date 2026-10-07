import { useCallback, useEffect, useRef, useState } from 'react';
import { api, formatPrice } from '../../api.js';
import { useTranslation } from '../../context/TranslationContext.jsx';

const empty = { name: '', price: '', oldPrice: '', category: '', gender: '', description: '', image: '', stock: '', sizes: '' };

const parseSizes = (v) => String(v || '').split(/[,،;|/]/).map((s) => s.trim()).filter(Boolean).slice(0, 20);
const sizesToString = (s) => (Array.isArray(s) ? s.join(', ') : String(s || ''));

const catKey = (cat) => ({ 'ملابس': 'catClothes', 'أحذية': 'catShoes', 'حقائب': 'catBags', 'إكسسوارات': 'catAccessories' })[cat] || '';

const genderKey = (g) => ({ '': 'allGenders', 'women': 'womenGender', 'men': 'menGender', 'kids': 'kidsGender' })[g] || 'allGenders';

export function genderLabel(g, t) {
  return t ? t(genderKey(g)) : g;
}

export default function AdminProducts() {
  const { t, lang } = useTranslation();
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
      setError(t('invalidImageFormat'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('imageTooLarge'));
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
      stock: product.stock,
      sizes: sizesToString(product.sizes)
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
    setLoading(false);
    try {
      const data = {
        ...form,
        price: Number(form.price) || 0,
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        stock: Number(form.stock) || 0,
        sizes: parseSizes(form.sizes)
      };
      if (editingId) {
        await api.products.update(editingId, data);
        setSuccess(t('saveSuccess'));
      } else {
        await api.products.create(data);
        setSuccess(t('addSuccess'));
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
    const name = product[`name_${lang}`] || product.name;
    if (!confirm(t('deleteConfirm').replace('{name}', name))) return;
    try {
      await api.products.remove(product.id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>{t('manageProducts')}</h1>
      <form ref={formRef} className={`form admin-form ${editingId ? 'editing' : ''}`} onSubmit={save}>
        <h2 className="form-title">{editingId ? `${t('edit')}: ${form.name}` : t('addProduct')}</h2>
        <div className="grid-2">
          <div>
            <label>{t('productName')}</label>
            <input value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label>{t('price')}</label>
            <input type="number" min="0" value={form.price} onChange={set('price')} required />
          </div>
          <div>
            <label>{t('oldPrice')}</label>
            <input type="number" min="0" value={form.oldPrice} onChange={set('oldPrice')} placeholder={t('examplePrice')} />
          </div>
          <div>
            <label>{t('category')}</label>
            <input value={form.category} onChange={set('category')} placeholder={t('exampleCategory')} />
          </div>
          <div>
            <label>{t('gender')}</label>
            <select value={form.gender} onChange={set('gender')}>
              <option value="">{t('allGenders')}</option>
              <option value="women">{t('womenGender')}</option>
              <option value="men">{t('menGender')}</option>
              <option value="kids">{t('kidsGender')}</option>
            </select>
          </div>
          <div>
            <label>{t('stock')}</label>
            <input type="number" min="0" value={form.stock} onChange={set('stock')} />
          </div>
          <div>
            <label>{t('sizes')}</label>
            <input value={form.sizes} onChange={set('sizes')} placeholder={t('sizesPlaceholder')} />
          </div>
        </div>
        <label>{t('description')}</label>
        <textarea value={form.description} onChange={set('description')} rows={2} />
        <label>{t('image')}</label>
        <div className="upload-box">
          {form.image ? (
            <div className="upload-preview">
              <img src={form.image} alt="معاينة الصورة" />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm({ ...form, image: '' })}>
                {t('removeImage')}
              </button>
            </div>
          ) : (
            <label className="btn btn-outline upload-btn">
              📤 {t('selectImage')}
              <input type="file" accept=".jpg,.jpeg,.png" onChange={handleImageFile} hidden />
            </label>
          )}
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <div className="row">
          <button className="btn btn-primary" disabled={loading}>
            {editingId ? t('saveChanges') : t('addProduct')}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={() => openEditor(null)}>
              {t('cancel')}
            </button>
          )}
        </div>
      </form>

      <h2 className="mt">{t('currentProducts')} ({products.length})</h2>
      <table className="table">
        <thead>
          <tr>
            <th>{t('thImage')}</th>
            <th>{t('thName')}</th>
            <th>{t('thCategory')}</th>
            <th>{t('thGender')}</th>
            <th>{t('thPrice')}</th>
            <th>{t('thStock')}</th>
            <th>{t('thSizes')}</th>
            <th>{t('thActions')}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const displayName = p[`name_${lang}`] || p.name;
            const displayCat = catKey(p.category) ? t(catKey(p.category)) : (p[`category_${lang}`] || p.category || '—');
            return (
            <tr key={p.id}>
              <td>
                {p.image ? (
                  <img
                    src={p.image}
                    alt={displayName}
                    className="thumb"
                    onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                  />
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>{displayName}</td>
              <td>{displayCat}</td>
              <td>{t(genderKey(p.gender))}</td>
              <td>{formatPrice(p.price)}</td>
              <td>{p.stock}</td>
              <td>{sizesToString(p.sizes) || '—'}</td>
              <td className="row gap">
                <button className="btn btn-outline btn-sm" onClick={() => openEditor(p)}>{t('edit')}</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>{t('delete')}</button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}