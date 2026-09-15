import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useTranslation } from '../context/TranslationContext.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const { dispatch } = useCart();
  const { t, lang } = useTranslation();

  useEffect(() => {
    api.products.list().then((list) => {
      const found = list.find((p) => p.id === id);
      if (found) setProduct(found);
      else setNotFound(true);
    });
  }, [id]);

  if (notFound) {
    return <div className="container muted">{t('noProducts')}</div>;
  }
  if (!product) return <div className="container muted">{t('loading')}</div>;

  const name = product[`name_${lang}`] || product.name;

  return (
    <main className="container detail">
      <div className="detail-image">
        {product.image ? (
          <img src={product.image} alt={name} />
        ) : (
          <div className="no-image">{t('noDescription')}</div>
        )}
      </div>
      <div className="detail-info">
        {product.category && <span className="chip">{product.category}</span>}
        <h1>{name}</h1>
        <p className="detail-description">{product.description}</p>
        <p className="product-price big">{formatPrice(product.price)}</p>
        <p className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
          {product.stock > 0 ? `${t('inStock')} (${product.stock} ${t('all')})` : t('outOfStock')}
        </p>
        <button
          className="btn btn-primary"
          disabled={product.stock <= 0}
          onClick={() => dispatch({ type: 'add', product })}
        >
          {t('addToCart')}
        </button>
        <Link to="/cart" className="btn btn-outline">{t('goToCart')}</Link>
      </div>
    </main>
  );
}