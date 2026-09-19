import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext.jsx';
import { useSiteImages, useSiteTexts } from '../siteImages.js';

export function Hero() {
  const { t } = useTranslation();
  const images = useSiteImages();
  return (
    <section className="hero" style={{ backgroundImage: `url("${images.heroHome}")` }}>
      <div className="hero-content">
        <span className="hero-eyebrow">{t('hiyoraCollection')}</span>
        <p className="hero-subtitle">{t('hiyoraSubtitle')}</p>
        <a href="#latest" className="hero-cta">{t('shopNow')}</a>
      </div>
    </section>
  );
}

export function PromoBanner() {
  const { t } = useTranslation();
  const images = useSiteImages();
  return (
    <section className="promo-banner">
      <div className="promo-text">
        <span className="hero-eyebrow">{t('seasonCollection')}</span>
        <h2>{t('promoTitle')}</h2>
        <p>{t('promoDesc')}</p>
        <a href="#latest" className="btn btn-gold">{t('discoverCollection')}</a>
      </div>
      <div className="promo-image" style={{ backgroundImage: `url("${images.promo}")` }} />
    </section>
  );
}

const catKey = (cat) => ({ 'ملابس': 'catClothes', 'أحذية': 'catShoes', 'حقائب': 'catBags', 'إكسسوارات': 'catAccessories' })[cat] || '';

export function CategoryShowcase({ categories, products }) {
  const { t } = useTranslation();
  if (!categories || categories.length === 0) return null;
  const imageFor = (cat) => {
    const found = products.find((p) => p.category === cat && p.image);
    return found ? found.image : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80';
  };
  return (
    <section className="section">
      <div className="section-head">
        <span className="section-eyebrow">{t('categories')}</span>
        <h2 className="section-title">{t('categoriesTitle')}</h2>
      </div>
      <div className="cat-grid">
        {categories.map((cat) => (
          <Link key={cat} to={`/?category=${encodeURIComponent(cat)}`} className="cat-card">
            <img src={imageFor(cat)} alt={catKey(cat) ? t(catKey(cat)) : cat} loading="lazy" />
            <span>{catKey(cat) ? t(catKey(cat)) : cat}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const PERKS = [
  { icon: '🚚', titleKey: 'freeShipping', textKey: 'freeShippingText', customTitle: 'perk1Title', customText: 'perk1Text' },
  { icon: '💵', titleKey: 'cashOnDelivery', textKey: 'cashOnDeliveryText', customTitle: 'perk2Title', customText: 'perk2Text' },
  { icon: '✨', titleKey: 'satisfaction', textKey: 'satisfactionText', customTitle: 'perk3Title', customText: 'perk3Text' }
];

export function Perks() {
  const { t } = useTranslation();
  const texts = useSiteTexts();
  return (
    <section className="perks">
      {PERKS.map((p) => (
        <div key={p.titleKey} className="perk">
          <span className="perk-icon">{p.icon}</span>
          <h4>{texts[p.customTitle] || t(p.titleKey)}</h4>
          <p>{texts[p.customText] || t(p.textKey)}</p>
        </div>
      ))}
    </section>
  );
}

export function Newsletter({ gender } = {}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const titleKey = gender === 'men' ? 'newsletterTitleMen' : gender === 'kids' ? 'newsletterTitleKids' : 'newsletterTitle';
  const descKey = gender === 'men' ? 'newsletterDescMen' : gender === 'kids' ? 'newsletterDescKids' : 'newsletterDesc';

  function submit(e) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setDone(true);
  }

  return (
    <section className="newsletter">
      <h2>{t(titleKey)}</h2>
      <p>{t(descKey)}</p>
      {done ? (
        <p className="newsletter-success">{t('newsletterSuccess')}</p>
      ) : (
        <form className="newsletter-form" onSubmit={submit}>
          <input
            type="email"
            placeholder={t('newsletterEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-gold">{t('newsletterSubscribe')}</button>
        </form>
      )}
    </section>
  );
}

export function GenderShowcase() {
  const { t } = useTranslation();
  const images = useSiteImages();
  const GENDERS = [
    { to: '/women', label: t('women'), img: images.catWomen },
    { to: '/men', label: t('men'), img: images.catMen },
    { to: '/kids', label: t('kids'), img: images.catKids }
  ];
  return (
    <section className="section">
      <div className="section-head">
        <span className="section-eyebrow">{t('categories')}</span>
        <h2 className="section-title">{t('categoriesTitle')}</h2>
      </div>
      <div className="cat-grid">
        {GENDERS.map((g) => (
          <Link key={g.to} to={g.to} className="cat-card">
            <img src={g.img} alt={g.label} loading="lazy" />
            <span>{g.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
