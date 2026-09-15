import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';
import { useTranslation } from '../context/TranslationContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Perks, Newsletter } from '../components/HomeSections.jsx';

export default function GenderPage({ gender, eyebrow, title, subtitle, heroSeed, theme, tabs }) {
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
          <a href="#products" className="hero-cta">{t('shopNow')}</a>
        </div>
      </section>

      <main className="container" id="products">
        <section className="section">
          <div className="section-head">
            <span className="section-eyebrow">{t('latest')}</span>
            <h2 className="section-title">{title}</h2>
          </div>

          {tabs && tabs.length > 0 && (
            <div className="sub-tabs">
              {tabs.map((tab) => (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`chip-btn ${location.pathname === tab.to ? 'active' : ''}`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {loading && <div className="muted">{t('loading')}</div>}
          {!loading && !error && products.length === 0 && (
            <div className="muted">
              {t('noProductsFound')}{' '}
              <Link to="/">{t('home')}</Link>
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
