import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useTranslation } from '../context/TranslationContext.jsx';

const getSizes = (p) => {
  if (Array.isArray(p?.sizes)) return p.sizes.map((s) => String(s).trim()).filter(Boolean);
  return String(p?.sizes || '').split(/[,،;|/]/).map((s) => s.trim()).filter(Boolean);
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState('');
  const { dispatch } = useCart();
  const { t, lang } = useTranslation();

  useEffect(() => {
    setSelectedSize('');
    setSizeError('');
    setNotFound(false);
    setProduct(null);
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

  const catKey = (cat) => ({ 'ملابس': 'catClothes', 'أحذية': 'catShoes', 'حقائب': 'catBags', 'إكسسوارات': 'catAccessories' })[cat] || '';
  const catLabel = catKey(product.category) ? t(catKey(product.category)) : (product[`category_${lang}`] || product.category);

  const name = product[`name_${lang}`] || product.name;
  const sizes = getSizes(product);

  const addToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      setSizeError(t('pleaseSelectSize'));
      return;
    }
    setSizeError('');
    dispatch({ type: 'add', product, size: selectedSize });
  };

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
        {product.category && <span className="chip">{catLabel}</span>}
        <h1>{name}</h1>
        <p className="detail-description">{product.description}</p>
        <p className="product-price big">{formatPrice(product.price)}</p>
        {sizes.length > 0 && (
          <div>
            <p className="muted" style={{ marginBottom: 8 }}>{t('size')} :</p>
            <div className="row gap">
              {sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip-btn ${selectedSize === s ? 'active' : ''}`}
                  onClick={() => { setSelectedSize(s); setSizeError(''); }}
                >
                  {s}
                </button>
              ))}
            </div>
            {sizeError && <p className="alert alert-error" style={{ marginTop: 8 }}>{sizeError}</p>}
          </div>
        )}
        <p className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
          {product.stock > 0 ? `${t('inStock')} (${product.stock} ${t('all')})` : t('outOfStock')}
        </p>
        <button
          className="btn btn-primary"
          disabled={product.stock <= 0}
          onClick={addToCart}
        >
          {t('addToCart')}
        </button>
        <Link to="/cart" className="btn btn-outline">{t('goToCart')}</Link>
      </div>
    </main>
  );
}