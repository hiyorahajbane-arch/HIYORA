import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const { dispatch } = useCart();

  useEffect(() => {
    api.products.list().then((list) => {
      const found = list.find((p) => p.id === id);
      if (found) setProduct(found);
      else setNotFound(true);
    });
  }, [id]);

  if (notFound) {
    return <div className="container muted">المنتج غير موجود.</div>;
  }
  if (!product) return <div className="container muted">جارِ التحميل...</div>;

  return (
    <main className="container detail">
      <div className="detail-image">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <div className="no-image">لا توجد صورة</div>
        )}
      </div>
      <div className="detail-info">
        {product.category && <span className="chip">{product.category}</span>}
        <h1>{product.name}</h1>
        <p className="detail-description">{product.description}</p>
        <p className="product-price big">{formatPrice(product.price)}</p>
        <p className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
          {product.stock > 0 ? `متوفر (${product.stock} قطعة)` : 'نفد المخزون'}
        </p>
        <button
          className="btn btn-primary"
          disabled={product.stock <= 0}
          onClick={() => dispatch({ type: 'add', product })}
        >
          أضف إلى السلة
        </button>
        <Link to="/cart" className="btn btn-outline">الذهاب إلى السلة</Link>
      </div>
    </main>
  );
}