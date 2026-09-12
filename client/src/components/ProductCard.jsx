import { Link } from 'react-router-dom';
import { formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ product }) {
  const { dispatch } = useCart();
  const out = product.stock <= 0;

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-image-link">
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
        <p className="product-price">{formatPrice(product.price)}</p>
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