import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">HIYORA</div>
          <p>
            في HIYORA نقدّم لك تشكيلة مختارة بعناية لتواكبي أحدث صيحات الموضة.
            اكتشفي قطعاً عصرية وأنيقة بأسعار في المتناول.
          </p>
        </div>
        <div>
          <h4>معلومات</h4>
          <ul>
            <li><Link to="/">الرئيسية</Link></li>
            <li><Link to="/cart">سلة المشتريات</Link></li>
            <li><Link to="/admin">لوحة الإدارة</Link></li>
          </ul>
        </div>
        <div>
          <h4>تواصلي معنا</h4>
          <ul>
            <li>📞 <span dir="ltr">+212 600 000 000</span></li>
            <li>✉️ contact@hiyora.store</li>
            <li>📍 التوصيل لجميع المدن</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 HIYORA — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}