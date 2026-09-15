import { Link, useParams } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext.jsx';

export default function OrderSuccess() {
  const { id } = useParams();
  const { t } = useTranslation();
  return (
    <main className="container success">
      <div className="success-icon">✓</div>
      <h1>{t('orderSuccess')}</h1>
      <p className="muted">
        {t('orderId')} <strong className="order-id">{id}</strong>.
      </p>
      <Link to="/" className="btn btn-primary">{t('continueShop')}</Link>
    </main>
  );
}