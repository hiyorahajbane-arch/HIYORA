import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import { Perks, Newsletter } from '../components/HomeSections.jsx';

const norm = (s) => (s || '').toString().toLowerCase();

export default function SubCategoryPage({ gender, keywords, title, subtitle, eyebrow, heroSeed, tabs, theme }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.products.list()
      .then((list) => {
        if (!cancelled) {
          const keys = keywords.map(norm);
          setProducts(
            list.filter(
              (p) =>
                (!p.gender || p.gender === gender) &&
                keys.some((k) => norm(p.category).includes(k))
            )
          );
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gender, keywords.join('|')]);

  return (
    <div className={theme || ''}>
      <section
        className="hero hero-gender"
        style={{ backgroundImage: `url("https://picsum.photos/seed/${heroSeed}/1600/800")` }}
      >
        <div className="hero-content">
          <span className="hero-eyebrow">{eyebrow}</span>
          <h1 className="hero-title">{title}</h1>
          <p className="hero-subtitle">{subtitle}</p>
          <a href="#products" className="hero-cta">تسوّقي الآن</a>
        </div>
      </section>

      <main className="container" id="products">
        <section className="section">
          <div className="section-head">
            <span className="section-eyebrow">تشكيلة النساء</span>
            <h2 className="section-title">{title}</h2>
          </div>

          {tabs && tabs.length > 0 && (
            <div className="sub-tabs">
              {tabs.map((t) => (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`chip-btn ${location.pathname === t.to ? 'active' : ''}`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {loading && <div className="muted">جارِ التحميل...</div>}
          {!loading && !error && products.length === 0 && (
            <div className="muted">
              لا توجد منتجات بعد في هذه الفئة. حددي تصنيف المنتج من الإدارة
              (ملابس / أحذية / حقائب / إكسسوارات).
            </div>
          )}

          <div className="grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        <Perks />
        <Newsletter />
      </main>
    </div>
  );
}
