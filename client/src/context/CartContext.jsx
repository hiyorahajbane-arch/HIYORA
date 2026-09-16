import { createContext, useContext, useEffect, useReducer } from 'react';

const CartContext = createContext(null);

const lineKey = (id, size) => `${id}__${size || ''}`;

const matchLine = (item, key, id, size) => {
  if (key) return (item.key || lineKey(item.id, item.size)) === key;
  return item.id === id && (item.size || '') === (size || '');
};

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const size = action.size || action.product.size || '';
      const key = action.key || lineKey(action.product.id, size);
      const existing = state.items.find((i) => matchLine(i, key));
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            matchLine(i, key) ? { ...i, qty: i.qty + 1 } : i
          )
        };
      }
      return { ...state, items: [...state.items, { ...action.product, size, key, qty: 1 }] };
    }
    case 'setQty':
      return {
        ...state,
        items: action.qty > 0
          ? state.items.map((i) => (matchLine(i, action.key, action.id, action.size) ? { ...i, qty: action.qty } : i))
          : state.items.filter((i) => !matchLine(i, action.key, action.id, action.size))
      };
    case 'remove':
      return { ...state, items: state.items.filter((i) => !matchLine(i, action.key, action.id, action.size)) };
    case 'clear':
      return { ...state, items: [] };
    default:
      return state;
  }
}

function loadInitial() {
  try {
    const raw = localStorage.getItem('souk_cart');
    if (!raw) return { items: [] };
    const items = JSON.parse(raw).map((i) => ({
      ...i,
      size: i.size || '',
      key: i.key || lineKey(i.id, i.size)
    }));
    return { items };
  } catch {
    return { items: [] };
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    localStorage.setItem('souk_cart', JSON.stringify(state.items));
  }, [state.items]);

  const count = state.items.reduce((s, i) => s + i.qty, 0);
  const total = state.items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <CartContext.Provider value={{ items: state.items, count, total, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}