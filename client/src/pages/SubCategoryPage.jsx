import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { useTranslation } from '../context/TranslationContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Perks, Newsletter } from '../components/HomeSections.jsx';

const HERO_IMAGES = {
  women: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1600&q=80',
  men: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1600&q=80',
  kids: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1600&q=80'
};

const norm = (s) => (s || '').toString().toLowerCase();

export default function SubCategoryPage({ gender, keywords, title, subtitle, eyebrow, heroSeed, tabs, theme }) {
  const { t } = useTranslation();
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
        style={{ backgroundImage: `url("${HERO_IMAGES[gender] || `https://picsum.photos/seed/${heroSeed}/1600/800`}")` }}
      >
        <div className="hero-content">
          <span className="hero-eyebrow">{eyebrow}</span>
          <h1 className="hero-title">{title}</h1>
          <p className="hero-subtitle">{subtitle}</p>
          <a href="#products" className="hero-cta">{t('shopNow')}</a>
        </div>
      </section>

      <main className="container" id="products">
        <section className="section">
          <div className="section-head">
            <span className="section-eyebrow">{t('hiyoraCollection')}</span>
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
          {loading && <div className="muted">{t('loading')}</div>}
          {!loading && !error && products.length === 0 && (
            <div className="muted">
              {t('noProductsFound')}
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
