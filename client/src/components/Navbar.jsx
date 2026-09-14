import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

const MESSAGES = [
  'التوصيل مجاني لجميع الطلبات',
  'تخفيضات حصرية على التشكيلة الجديدة',
  'الدفع عند الاستلام'
];

export default function Navbar() {
  const { count } = useCart();
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  function search(e) {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/');
  }

  return (
    <>
      <div className="announcement">{MESSAGES[msg]}</div>
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand">
            HIYORA<small>FASHION STORE</small>
          </Link>
          <form className="nav-search" onSubmit={search}>
            <input
              type="search"
              placeholder="ابحث عن منتج..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit" title="بحث">🔍</button>
          </form>
          <nav className="nav-links">
            <NavLink to="/" end>الرئيسية</NavLink>
            <NavLink to="/women">نساء</NavLink>
            <NavLink to="/men">رجال</NavLink>
            <NavLink to="/kids">أطفال</NavLink>
            <NavLink to="/cart" className="cart-link" title="السلة">
              🛒 {count > 0 && <span className="badge">{count}</span>}
            </NavLink>
          </nav>
        </div>
      </header>
    </>
  );
}