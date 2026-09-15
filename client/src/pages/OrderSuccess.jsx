import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext.jsx';

const WHATSAPP_NUMBER = '+212675993497';

export default function OrderSuccess() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [whatsappUrl, setWhatsappUrl] = useState('');

  useEffect(() => {
    const msg = t('whatsappMessage').replace('{orderId}', id);
    const url = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(msg)}`;
    setWhatsappUrl(url);
  }, [id, t]);

  return (
    <main className="container success">
      <div className="success-icon">✓</div>
      <h1>{t('orderSuccess')}</h1>
      <p className="muted">
        {t('orderId')} <strong className="order-id">{id}</strong>.
      </p>
      <div className="whatsapp-section">
        <p className="muted small">{t('whatsappHint')}</p>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
          {t('openWhatsApp')} 💬
        </a>
      </div>
      <Link to="/" className="btn btn-primary">{t('continueShop')}</Link>
    </main>
  );
}