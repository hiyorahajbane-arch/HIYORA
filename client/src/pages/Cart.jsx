import { Link } from 'react-router-dom';
import { formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';
import { useTranslation } from '../context/TranslationContext.jsx';

export default function Cart() {
  const { items, total, dispatch } = useCart();
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <main className="container">
        <h1>{t('cartTitle')}</h1>
        <p className="muted">{t('emptyCart')}</p>
        <Link to="/" className="btn btn-outline">{t('continueShopping')}</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>{t('cartTitle')}</h1>
      <div className="cart-layout">
        <ul className="cart-list">
          {items.map((item) => (
            <li key={item.id} className="cart-item">
              {item.image && <img src={item.image} alt={item.name} />}
              <div className="cart-item-info">
                <Link to={`/product/${item.id}`} className="cart-item-name">{item.name}</Link>
                <span className="muted">{formatPrice(item.price)}</span>
              </div>
              <div className="qty-control">
                <button onClick={() => dispatch({ type: 'setQty', id: item.id, qty: item.qty - 1 })}>−</button>
                <span>{item.qty}</span>
                <button onClick={() => dispatch({ type: 'setQty', id: item.id, qty: item.qty + 1 })}>+</button>
              </div>
              <span className="cart-item-total">{formatPrice(item.price * item.qty)}</span>
              <button
                className="icon-btn"
                title={t('delete')}
                onClick={() => dispatch({ type: 'remove', id: item.id })}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <aside className="summary">
          <h3>{t('orderSummary')}</h3>
          <div className="summary-row"><span>{t('total')}</span><span>{items.reduce((s, i) => s + i.qty, 0)}</span></div>
          <div className="summary-row total"><span>{t('total')}</span><span>{formatPrice(total)}</span></div>
          <Link to="/checkout" className="btn btn-primary btn-block">{t('confirmOrder')}</Link>
          <Link to="/" className="btn btn-outline btn-block">{t('continueShopping')}</Link>
        </aside>
      </div>
    </main>
  );
}