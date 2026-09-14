import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Store from './pages/Store.jsx';
import GenderPage from './pages/GenderPage.jsx';
import SubCategoryPage from './pages/SubCategoryPage.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';

const WOMEN_TABS = [
  { to: '/women', label: 'الكل' },
  { to: '/women/clothes', label: 'ملابس' },
  { to: '/women/shoes-bags', label: 'أحذية وحقائب' },
  { to: '/women/accessories', label: 'إكسسوارات' }
];

const MEN_TABS = [
  { to: '/men', label: 'الكل' },
  { to: '/men/clothes', label: 'ملابس' },
  { to: '/men/shoes-bags', label: 'أحذية وحقائب' },
  { to: '/men/accessories', label: 'إكسسوارات' }
];

const KIDS_TABS = [
  { to: '/kids', label: 'الكل' },
  { to: '/kids/clothes', label: 'ملابس' },
  { to: '/kids/shoes-bags', label: 'أحذية وحقائب' },
  { to: '/kids/accessories', label: 'إكسسوارات' }
];

const CLOTHES_KEYS = ['ملابس', 'لباس', 'فستان', 'فساتين', 'قميص', 'بنطلون', 'سروال', 'تنورة', 'عباية', 'قفطان', 'طقم', 'clothes', 'vetement', 'robe', 'dress'];
const SHOES_BAGS_KEYS = ['حذاء', 'أحذية', 'صندل', 'حقائب', 'حقيبة', 'chaussure', 'sac', 'shoe', 'bag', 'sneaker'];
const ACCESSORIES_KEYS = ['إكسسوار', 'اكسسوار', 'مجوهرات', 'ساعة', 'نظارة', 'وشاح', 'حزام', 'قبعة', 'accessoire', 'accessory', 'bijou', 'montre', 'lunette'];

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
              keywords={CLOTHES_KEYS}
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
              keywords={SHOES_BAGS_KEYS}
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
              keywords={ACCESSORIES_KEYS}
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
              tabs={MEN_TABS}
            />
          }
        />
        <Route
          path="/men/clothes"
          element={
            <SubCategoryPage
              gender="men"
              keywords={CLOTHES_KEYS}
              title="ملابس الرجال"
              subtitle="قصّات عصرية وخامات ممتازة"
              eyebrow="MEN FASHION"
              heroSeed="hiyora-men-clothes"
              tabs={MEN_TABS}
              theme="theme-men"
            />
          }
        />
        <Route
          path="/men/shoes-bags"
          element={
            <SubCategoryPage
              gender="men"
              keywords={SHOES_BAGS_KEYS}
              title="أحذية وحقائب الرجال"
              subtitle="راحة وأناقة في كل خطوة"
              eyebrow="SHOES & BAGS"
              heroSeed="hiyora-men-shoes"
              tabs={MEN_TABS}
              theme="theme-men"
            />
          }
        />
        <Route
          path="/men/accessories"
          element={
            <SubCategoryPage
              gender="men"
              keywords={ACCESSORIES_KEYS}
              title="إكسسوارات الرجال"
              subtitle="تفاصيل تصنع الحضور"
              eyebrow="ACCESSORIES"
              heroSeed="hiyora-men-accessories"
              tabs={MEN_TABS}
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
              tabs={KIDS_TABS}
            />
          }
        />
        <Route
          path="/kids/clothes"
          element={
            <SubCategoryPage
              gender="kids"
              keywords={CLOTHES_KEYS}
              title="ملابس الأطفال"
              subtitle="قطع مريحة ومرحة لصغارك"
              eyebrow="KIDS FASHION"
              heroSeed="hiyora-kids-clothes"
              tabs={KIDS_TABS}
              theme="theme-kids"
            />
          }
        />
        <Route
          path="/kids/shoes-bags"
          element={
            <SubCategoryPage
              gender="kids"
              keywords={SHOES_BAGS_KEYS}
              title="أحذية وحقائب الأطفال"
              subtitle="خطوات مرحة وحقائب ملوّنة"
              eyebrow="SHOES & BAGS"
              heroSeed="hiyora-kids-shoes"
              tabs={KIDS_TABS}
              theme="theme-kids"
            />
          }
        />
        <Route
          path="/kids/accessories"
          element={
            <SubCategoryPage
              gender="kids"
              keywords={ACCESSORIES_KEYS}
              title="إكسسوارات الأطفال"
              subtitle="لمسات مرحة تكمّل الإطلالة"
              eyebrow="ACCESSORIES"
              heroSeed="hiyora-kids-accessories"
              tabs={KIDS_TABS}
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