import { useState } from 'react';
import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-eyebrow">HIYORA COLLECTION</span>
        <h1 className="hero-title">HIYORA</h1>
        <p className="hero-subtitle">اكتشفي عالمك الخاص بالموضة — أنيق، بسيط، لا يُقاوم</p>
        <a href="#latest" className="hero-cta">تسوّقي عروضنا</a>
      </div>
    </section>
  );
}

export function PromoBanner() {
  return (
    <section className="promo-banner">
      <div className="promo-text">
        <span className="hero-eyebrow">تشكيلة الموسم</span>
        <h2>لا تفوّتي آخر الصيحات!</h2>
        <p>قطع عصرية تضاف باستمرار لتكمّلي إطلالتك المثالية.</p>
        <a href="#latest" className="btn btn-gold">اكتشفي التشكيلة</a>
      </div>
      <div className="promo-image" />
    </section>
  );
}

export function CategoryShowcase({ categories, products }) {
  if (!categories || categories.length === 0) return null;
  const imageFor = (cat) => {
    const found = products.find((p) => p.category === cat && p.image);
    return found ? found.image : `https://picsum.photos/seed/${encodeURIComponent(cat)}/600/800`;
  };
  return (
    <section className="section">
      <div className="section-head">
        <span className="section-eyebrow">تسوّقي حسب الفئة</span>
        <h2 className="section-title">تصنيفاتنا</h2>
      </div>
      <div className="cat-grid">
        {categories.map((cat) => (
          <Link key={cat} to={`/?category=${encodeURIComponent(cat)}`} className="cat-card">
            <img src={imageFor(cat)} alt={cat} loading="lazy" />
            <span>{cat}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const PERKS = [
  { icon: '🚚', title: 'توصيل مجاني', text: 'التوصيل مجاني لجميع طلباتك.' },
  { icon: '💵', title: 'الدفع عند الاستلام', text: 'ادفعي بكل ثقة عند وصول طلبك.' },
  { icon: '✨', title: 'رضاك التزامنا', text: 'رضاك هو التزامنا اليومي.' }
];

export function Perks() {
  return (
    <section className="perks">
      {PERKS.map((p) => (
        <div key={p.title} className="perk">
          <span className="perk-icon">{p.icon}</span>
          <h4>{p.title}</h4>
          <p>{p.text}</p>
        </div>
      ))}
    </section>
  );
}

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setDone(true);
  }

  return (
    <section className="newsletter">
      <h2>اشتركي ليصلك جديد عروضنا</h2>
      <p>كوني أول من يعرف عن التشكيلات الجديدة والتخفيضات الحصرية.</p>
      {done ? (
        <p className="newsletter-success">شكراً لاشتراكك! أهلاً بك في عائلة HIYORA ✨</p>
      ) : (
        <form className="newsletter-form" onSubmit={submit}>
          <input
            type="email"
            placeholder="بريدك الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-gold">اشتراك</button>
        </form>
      )}
    </section>
  );
}
