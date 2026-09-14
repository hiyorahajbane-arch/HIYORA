import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Store from './pages/Store.jsx';
import GenderPage from './pages/GenderPage.jsx';
import SubCategoryPage from './pages/SubCategoryPage.jsx';

const WOMEN_TABS = [
  { to: '/women', label: 'الكل' },
  { to: '/women/clothes', label: 'ملابس' },
  { to: '/women/shoes-bags', label: 'أحذية وحقائب' },
  { to: '/women/accessories', label: 'إكسسوارات' }
];
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Store />} />
        <Route
          path="/women"
          element={
            <GenderPage
              gender="women"
              eyebrow="WOMEN COLLECTION"
              title="تشكيلة النساء"
              subtitle="أناقة تليق بك — قطع عصرية مختارة بعناية"
              heroSeed="hiyora-women"
              theme=""
              tabs={WOMEN_TABS}
            />
          }
        />
        <Route
          path="/women/clothes"
          element={
            <SubCategoryPage
              gender="women"
              keywords={['ملابس', 'لباس', 'فستان', 'فساتين', 'قميص', 'بنطلون', 'سروال', 'تنورة', 'عباية', 'قفطان', 'clothes', 'vetement', 'robe', 'dress']}
              title="ملابس النساء"
              subtitle="فساتين وأطقم عصرية لكل مناسبة"
              eyebrow="WOMEN FASHION"
              heroSeed="hiyora-women-clothes"
              tabs={WOMEN_TABS}
            />
          }
        />
        <Route
          path="/women/shoes-bags"
          element={
            <SubCategoryPage
              gender="women"
              keywords={['حذاء', 'أحذية', 'صندل', 'حقائب', 'حقيبة', 'chaussure', 'sac', 'shoe', 'bag', 'sneaker']}
              title="الأحذية والحقائب"
              subtitle="أحذية مريحة وحقائب أنيقة تكمّل إطلالتك"
              eyebrow="SHOES & BAGS"
              heroSeed="hiyora-women-shoes"
              tabs={WOMEN_TABS}
            />
          }
        />
        <Route
          path="/women/accessories"
          element={
            <SubCategoryPage
              gender="women"
              keywords={['إكسسوار', 'اكسسوار', 'مجوهرات', 'ساعة', 'نظارة', 'وشاح', 'حزام', 'accessoire', 'accessory', 'bijou', 'montre', 'lunette']}
              title="إكسسوارات النساء"
              subtitle="لمسات أخيرة تصنع الفرق"
              eyebrow="ACCESSORIES"
              heroSeed="hiyora-women-accessories"
              tabs={WOMEN_TABS}
            />
          }
        />
        <Route
          path="/men"
          element={
            <GenderPage
              gender="men"
              eyebrow="MEN COLLECTION"
              title="تشكيلة الرجال"
              subtitle="أناقة الرجل العصري — جودة وحضور"
              heroSeed="hiyora-men"
              theme="theme-men"
            />
          }
        />
        <Route
          path="/kids"
          element={
            <GenderPage
              gender="kids"
              eyebrow="KIDS COLLECTION"
              title="تشكيلة الأطفال"
              subtitle="مرح وألوان لصغارك — راحة وبهجة"
              heroSeed="hiyora-kids"
              theme="theme-kids"
            />
          }
        />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success/:id" element={<OrderSuccess />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
      </Routes>
      <Footer />
    </>
  );
}