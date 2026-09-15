import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useTranslation } from '../context/TranslationContext.jsx';

export default function OrderSuccess() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [whatsapp, setWhatsapp] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  useEffect(() => {
    api._raw('/api').then((d) => {
      if (d.whatsapp) {
        setWhatsapp(d.whatsapp);
        const msg = t('whatsappMessage').replace('{orderId}', id);
        const url = `https://wa.me/${d.whatsapp.replace('+', '')}?text=${encodeURIComponent(msg)}`;
        setWhatsappUrl(url);
      }
    }).catch(() => {});
  }, [id, t]);

  return (
    <main className="container success">
      <div className="success-icon">✓</div>
      <h1>{t('orderSuccess')}</h1>
      <p className="muted">
        {t('orderId')} <strong className="order-id">{id}</strong>.
      </p>
      {whatsapp && (
        <div className="whatsapp-section">
          <p className="muted small">{t('whatsappHint')}</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            {t('openWhatsApp')} 💬
          </a>
        </div>
      )}
      <Link to="/" className="btn btn-primary">{t('continueShop')}</Link>
    </main>
  );
}