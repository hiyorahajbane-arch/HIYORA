import { Link } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext.jsx';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand"><img src="/images/logo-hiyora.jpeg" alt="HIYORA" className="footer-logo" />{t('footerBrand')}</div>
          <p>{t('footerDesc')}</p>
        </div>
        <div>
          <h4>{t('info')}</h4>
          <ul>
            <li><Link to="/">{t('home')}</Link></li>
            <li><Link to="/cart">{t('cart')}</Link></li>
            <li><Link to="/checkout">{t('confirmOrder')}</Link></li>
          </ul>
        </div>
        <div>
          <h4>{t('contactUs')}</h4>
          <ul>
            <li>📞 <span dir="ltr">{t('footerPhone')}</span></li>
            <li>✉️ {t('footerEmail')}</li>
            <li>📍 {t('footerAddress')}</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        {t('rights')}
      </div>
    </footer>
  );
}