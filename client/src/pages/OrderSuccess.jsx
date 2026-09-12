import { Link, useParams } from 'react-router-dom';

export default function OrderSuccess() {
  const { id } = useParams();
  return (
    <main className="container success">
      <div className="success-icon">✓</div>
      <h1>تم استلام طلبك بنجاح!</h1>
      <p className="muted">
        رقم طلبك هو <strong className="order-id">{id}</strong>. سنتواصل معك قريباً لتأكيد الطلب.
      </p>
      <Link to="/" className="btn btn-primary">متابعة التسوق</Link>
    </main>
  );
}