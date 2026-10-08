import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useTranslation } from '../context/TranslationContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Hero, PromoBanner, GenderShowcase, Perks, Newsletter } from '../components/HomeSections.jsx';

const CAT_KEYS = {
  'ملابس': 'catClothes', 'vêtements': 'catClothes', 'vetements': 'catClothes', 'clothing': 'catClothes',
  'أحذية': 'catShoes', 'chaussures': 'catShoes', 'shoes': 'catShoes',
  'حقائب': 'catBags', 'sacs': 'catBags', 'bags': 'catBags',
  'إكسسوارات': 'catAccessories', 'accessoires': 'catAccessories', 'accessories': 'catAccessories',
  'إلكترونيات': 'catElectronics', 'électronique': 'catElectronics', 'electronique': 'catElectronics', 'électroniques': 'catElectronics', 'electronics': 'catElectronics'
};
const catKey = (cat) => CAT_KEYS[String(cat || '').trim().toLowerCase()] || '';
const isElectronics = (cat) => catKey(cat) === 'catElectronics';

// Fashion pill groups (like the women page tabs): shoes + bags share one pill
const PILL_GROUPS = [
  { id: 'clothes', keys: ['catClothes'], label: 'catClothes' },
  { id: 'shoesbags', keys: ['catShoes', 'catBags'], label: 'catShoesBags' },
  { id: 'accessories', keys: ['catAccessories'], label: 'catAccessories' }
];
const groupOf = (cat) => PILL_GROUPS.find((g) => g.keys.includes(catKey(cat))) || null;

export default function Store() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const timeout = setTimeout(async () => {
      try {
        const sel = PILL_GROUPS.find((g) => g.id === category) || (category ? groupOf(category) : null);
        const list = await api.products.list({ q, category: sel ? '' : category });
        if (cancelled) return;
        let visible = (list || []).filter((p) => !isElectronics(p.category));
        if (sel) visible = visible.filter((p) => sel.keys.includes(catKey(p.category)));
        setProducts(visible);
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
            <span className="section-eyebrow">{t('latest')}</span>
            <h2 className="section-title">{t('latestTitle')}</h2>
          </div>

          <div className="store-toolbar">
            <div className="chips">
              <button
                className={`chip-btn ${category === '' ? 'active' : ''}`}
                onClick={() => set('category', '')}
              >
                {t('all')}
              </button>
              {PILL_GROUPS.map((g) => {
                const active = category === g.id || (category !== '' && groupOf(category)?.id === g.id);
                return (
                  <button
                    key={g.id}
                    className={`chip-btn ${active ? 'active' : ''}`}
                    onClick={() => set('category', g.id)}
                  >
                    {t(g.label)}
                  </button>
                );
              })}
            </div>
            {q && (
              <p className="muted">
                {t('searchResults')} <strong>{q}</strong>{' '}
                <button className="icon-btn" onClick={() => set('q', '')} title={t('close')}>✕</button>
              </p>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {loading && <div className="muted">{t('loading')}</div>}
          {!loading && !error && products.length === 0 && (
            <div className="muted">{t('noProducts')}</div>
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