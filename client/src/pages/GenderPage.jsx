import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import { Perks, Newsletter } from '../components/HomeSections.jsx';

export default function GenderPage({ gender, eyebrow, title, subtitle, heroSeed, theme }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.products.list()
      .then((list) => {
        if (!cancelled) {
          setProducts(list.filter((p) => !p.gender || p.gender === gender));
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
  }, [gender]);

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
          <a href="#products" className="hero-cta">تسوّق الآن</a>
        </div>
      </section>

      <main className="container" id="products">
        <section className="section">
          <div className="section-head">
            <span className="section-eyebrow">مختارات لك</span>
            <h2 className="section-title">{title}</h2>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {loading && <div className="muted">جارِ التحميل...</div>}
          {!loading && !error && products.length === 0 && (
            <div className="muted">
              لا توجد منتجات بعد في هذه الفئة.{' '}
              <Link to="/">عودة للرئيسية</Link>
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
