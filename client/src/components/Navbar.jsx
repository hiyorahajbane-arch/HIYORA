import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { count } = useCart();
  const [q, setQ] = useState('');

  return (
    <header className="navbar">
      <Link to="/" className="brand">🛍️ سوق</Link>
      <nav className="nav-links">
        <NavLink to="/" end>المتجر</NavLink>
        <NavLink to="/cart">السلة {count > 0 && <span className="badge">{count}</span>}</NavLink>
        <NavLink to="/admin">الإدارة</NavLink>
      </nav>
    </header>
  );
}