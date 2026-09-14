import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import { Hero, PromoBanner, GenderShowcase, Perks, Newsletter } from '../components/HomeSections.jsx';

export default function Store() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
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

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  return (
    <>
      <Hero />
      <main className="container" id="latest">
        <section className="section">
          <div className="section-head">
            <span className="section-eyebrow">وصل حديثاً</span>
            <h2 className="section-title">أحدث التشكيلات</h2>
          </div>

          <div className="store-toolbar">
            <div className="chips">
              <button
                className={`chip-btn ${category === '' ? 'active' : ''}`}
                onClick={() => set('category', '')}
              >
                الكل
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  className={`chip-btn ${category === c ? 'active' : ''}`}
                  onClick={() => set('category', c)}
                >
                  {c}
                </button>
              ))}
            </div>
            {q && (
              <p className="muted">
                نتائج البحث عن: <strong>{q}</strong>{' '}
                <button className="icon-btn" onClick={() => set('q', '')} title="مسح البحث">✕</button>
              </p>
            )}
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
        </section>

        <PromoBanner />
        <GenderShowcase />
        <Perks />
        <Newsletter />
      </main>
    </>
  );
}