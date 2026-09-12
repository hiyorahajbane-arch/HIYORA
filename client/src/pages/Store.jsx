import { useEffect, useState } from 'react';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Store() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.products.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const timeout = setTimeout(async () => {
      try {
        const list = await api.products.list({ q, category });
        if (!cancelled) setProducts(list);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [q, category]);

  return (
    <main className="container store">
      <div className="store-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="ابحث عن منتج..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chips">
          <button
            className={`chip-btn ${category === '' ? 'active' : ''}`}
            onClick={() => setCategory('')}
          >
            الكل
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`chip-btn ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="muted">جارِ التحميل...</div>}
      {!loading && !error && products.length === 0 && (
        <div className="muted">لا توجد منتجات مطابقة.</div>
      )}

      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
}