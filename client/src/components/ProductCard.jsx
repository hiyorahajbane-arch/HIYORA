import { Link } from 'react-router-dom';
import { formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useTranslation } from '../context/TranslationContext.jsx';

const catKey = (cat) => ({ 'ملابس': 'catClothes', 'أحذية': 'catShoes', 'حقائب': 'catBags', 'إكسسوارات': 'catAccessories' })[cat] || '';

const getSizes = (p) => {
  if (Array.isArray(p?.sizes)) return p.sizes.map((s) => String(s).trim()).filter(Boolean);
  return String(p?.sizes || '').split(/[,،;|/]/).map((s) => s.trim()).filter(Boolean);
};

export default function ProductCard({ product }) {
  const { dispatch } = useCart();
  const { lang, t } = useTranslation();
  const out = product.stock <= 0;
  const promo = product.oldPrice > product.price;
  const name = product[`name_${lang}`] || product.name;
  const catLabel = catKey(product.category) ? t(catKey(product.category)) : (product[`category_${lang}`] || product.category);
  const sizes = getSizes(product);

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-image-link">
        {promo && <span className="promo-badge">{lang === 'ar' ? 'تخفيض!' : lang === 'fr' ? 'Promo !' : 'Sale!'}</span>}
        {product.image ? (
          <img src={product.image} alt={name} loading="lazy" />
        ) : (
          <div className="no-image">{lang === 'ar' ? 'لا توجد صورة' : lang === 'fr' ? 'Pas d\'image' : 'No image'}</div>
        )}
      </Link>
      <div className="product-body">
        {product.category && <span className="chip">{catLabel}</span>}
        <h3 className="product-name">
          <Link to={`/product/${product.id}`}>{name}</Link>
        </h3>
        <div className="price-row">
          <span className="product-price">{formatPrice(product.price)}</span>
          {promo && <span className="old-price">{formatPrice(product.oldPrice)}</span>}
        </div>
        {sizes.length > 0 && !out ? (
          <Link to={`/product/${product.id}`} className="btn btn-outline btn-block">
            {t('selectSize')}
          </Link>
        ) : (
          <button
            className="btn btn-primary btn-block"
            disabled={out}
            onClick={() => dispatch({ type: 'add', product })}
          >
            {out ? (lang === 'ar' ? 'نفد المخزون' : lang === 'fr' ? 'Rupture de stock' : 'Out of stock') : (lang === 'ar' ? 'أضف إلى السلة' : lang === 'fr' ? 'Ajouter au panier' : 'Add to cart')}
          </button>
        )}
      </div>
    </div>
  );
}