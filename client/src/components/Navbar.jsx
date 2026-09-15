import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useTranslation } from '../context/TranslationContext.jsx';

const LANGS = [
  { code: 'ar', flag: '🇲🇦', img: 'https://flagcdn.com/w20/ma.png', label: 'العربية' },
  { code: 'fr', flag: '🇫🇷', img: 'https://flagcdn.com/w20/fr.png', label: 'Français' },
  { code: 'en', flag: '🇬🇧', img: 'https://flagcdn.com/w20/gb.png', label: 'English' }
];

export default function Navbar() {
  const { count } = useCart();
  const { lang, setLang, t } = useTranslation();
  const [q, setQ] = useState('');

  return (
    <>
      <div className="announcement">{t('freeShipping')} — {t('cashOnDelivery')}</div>
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand">
            {t('brand')}<small>{t('brandSub')}</small>
          </Link>
          <div className="nav-links">
            <NavLink to="/" end>{t('home')}</NavLink>
            <NavLink to="/women">{t('women')}</NavLink>
            <NavLink to="/men">{t('men')}</NavLink>
            <NavLink to="/kids">{t('kids')}</NavLink>
            <NavLink to="/cart" className="cart-link" title="السلة">
              🛒 {count > 0 && <span className="badge">{count}</span>}
            </NavLink>
          </div>
          <div className="lang-switch">
            {LANGS.map((l) => (
              <button
                key={l.code}
                className={`lang-btn ${lang === l.code ? 'active' : ''}`}
                onClick={() => setLang(l.code)}
                title={l.label}
                aria-label={l.label}
              >
                <img src={l.img} alt={l.flag} className="flag-img" width="22" height="15" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
