import { Routes, Route } from 'react-router-dom';
import { useTranslation } from './context/TranslationContext.jsx';
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
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminImages from './pages/admin/AdminImages.jsx';
import AdminTexts from './pages/admin/AdminTexts.jsx';

export default function App() {
  const { t, lang } = useTranslation();

  const TAB_LABEL = (key) => t(key);

  const WOMEN_TABS = [
    { to: '/women', label: TAB_LABEL('all') },
    { to: '/women/clothes', label: TAB_LABEL('womenClothes') },
    { to: '/women/shoes-bags', label: TAB_LABEL('womenShoesBags') },
    { to: '/women/accessories', label: TAB_LABEL('womenAccessories') }
  ];

  const MEN_TABS = [
    { to: '/men', label: TAB_LABEL('all') },
    { to: '/men/clothes', label: TAB_LABEL('menClothes') },
    { to: '/men/shoes-bags', label: TAB_LABEL('menShoesBags') },
    { to: '/men/accessories', label: TAB_LABEL('menAccessories') }
  ];

  const KIDS_TABS = [
    { to: '/kids', label: TAB_LABEL('all') },
    { to: '/kids/clothes', label: TAB_LABEL('kidsClothes') },
    { to: '/kids/shoes-bags', label: TAB_LABEL('kidsShoesBags') },
    { to: '/kids/accessories', label: TAB_LABEL('kidsAccessories') }
  ];

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Store />} />
        <Route
          path="/women"
          element={
            <GenderPage
              gender="women"
              eyebrow={t('hiyoraCollection')}
              title={t('womenTitle')}
              subtitle={t('womenSubtitle')}
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
              keywords={['ملابس', 'لباس', 'فستان', 'فساتين', 'قميص', 'بنطلون', 'سروال', 'تنورة', 'عباية', 'قفطان', 'طقم', 'clothes', 'vetement', 'robe', 'dress']}
              title={t('womenClothes')}
              subtitle={t('womenClothesSub')}
              eyebrow={t('hiyoraCollection')}
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
              title={t('womenShoesBags')}
              subtitle={t('womenShoesBagsSub')}
              eyebrow={t('hiyoraCollection')}
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
              keywords={['إكسسوار', 'اكسسوار', 'مجوهرات', 'ساعة', 'نظارة', 'وشاح', 'حزام', 'قبعة', 'accessoire', 'accessory', 'bijou', 'montre', 'lunette']}
              title={t('womenAccessories')}
              subtitle={t('womenAccessoriesSub')}
              eyebrow={t('hiyoraCollection')}
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
              eyebrow={t('hiyoraCollection')}
              title={t('menTitle')}
              subtitle={t('menSubtitle')}
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
              keywords={['ملابس', 'لباس', 'فستان', 'فساتين', 'قميص', 'بنطلون', 'سروال', 'تنورة', 'عباية', 'قفطان', 'طقم', 'clothes', 'vetement', 'robe', 'dress']}
              title={t('menClothes')}
              subtitle={t('menClothesSub')}
              eyebrow={t('hiyoraCollection')}
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
              keywords={['حذاء', 'أحذية', 'صندل', 'حقائب', 'حقيبة', 'chaussure', 'sac', 'shoe', 'bag', 'sneaker']}
              title={t('menShoesBags')}
              subtitle={t('menShoesBagsSub')}
              eyebrow={t('hiyoraCollection')}
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
              keywords={['إكسسوار', 'اكسسوار', 'مجوهرات', 'ساعة', 'نظارة', 'وشاح', 'حزام', 'قبعة', 'accessoire', 'accessory', 'bijou', 'montre', 'lunette']}
              title={t('menAccessories')}
              subtitle={t('menAccessoriesSub')}
              eyebrow={t('hiyoraCollection')}
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
              eyebrow={t('hiyoraCollection')}
              title={t('kidsTitle')}
              subtitle={t('kidsSubtitle')}
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
              keywords={['ملابس', 'لباس', 'فستان', 'فساتين', 'قميص', 'بنطلون', 'سروال', 'تنورة', 'عباية', 'قفطان', 'طقم', 'clothes', 'vetement', 'robe', 'dress']}
              title={t('kidsClothes')}
              subtitle={t('kidsClothesSub')}
              eyebrow={t('hiyoraCollection')}
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
              keywords={['حذاء', 'أحذية', 'صندل', 'حقائب', 'حقيبة', 'chaussure', 'sac', 'shoe', 'bag', 'sneaker']}
              title={t('kidsShoesBags')}
              subtitle={t('kidsShoesBagsSub')}
              eyebrow={t('hiyoraCollection')}
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
              keywords={['إكسسوار', 'اكسسوار', 'مجوهرات', 'ساعة', 'نظارة', 'وشاح', 'حزام', 'قبعة', 'accessoire', 'accessory', 'bijou', 'montre', 'lunette']}
              title={t('kidsAccessories')}
              subtitle={t('kidsAccessoriesSub')}
              eyebrow={t('hiyoraCollection')}
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
          <Route path="images" element={<AdminImages />} />
          <Route path="texts" element={<AdminTexts />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
      <Footer />
    </div>
  );
}
