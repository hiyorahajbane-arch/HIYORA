import { Link } from 'react-router-dom';
import { formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ product }) {
  const { dispatch } = useCart();
  const out = product.stock <= 0;
  const promo = product.oldPrice > product.price;

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-image-link">
        {promo && <span className="promo-badge">تخفيض!</span>}
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <div className="no-image">لا توجد صورة</div>
        )}
      </Link>
      <div className="product-body">
        {product.category && <span className="chip">{product.category}</span>}
        <h3 className="product-name">
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="price-row">
          <span className="product-price">{formatPrice(product.price)}</span>
          {promo && <span className="old-price">{formatPrice(product.oldPrice)}</span>}
        </div>
        <button
          className="btn btn-primary btn-block"
          disabled={out}
          onClick={() => dispatch({ type: 'add', product })}
        >
          {out ? 'نفد المخزون' : 'أضف إلى السلة'}
        </button>
      </div>
    </div>
  );
}