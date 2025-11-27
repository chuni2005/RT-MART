import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./shared/contexts/AuthContext";
import Header from "./shared/components/Header";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import ProductDetail from "./pages/Product";
import Store from "./pages/Store";
import "./shared/lib/iconLibrary";

// Header Wrapper Component to handle conditional rendering
function AppHeader() {
  const location = useLocation();

  if (location.pathname === "/auth") {
    return <Header variant="simple" />;
  }

  if (location.pathname.startsWith("/seller") || location.pathname.startsWith("/admin")) {
    return <Header variant="admin" />;
  }

  return <Header />;
}

function AppContent() {
  return (
    <div className="App">
      <AppHeader />
      <main>
        <Routes>
          {/* Buyer Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/search" element={<Search />} />
          <Route path="/product/:product_id" element={<ProductDetail />} />
          <Route path="/store/:store_id" element={<Store />} />
          <Route path="/cart" element={<h2>購物車頁面開發中...</h2>} />
          <Route path="/checkout" element={<h2>結帳頁面開發中...</h2>} />
          <Route path="/order/success" element={<h2>訂單成功頁面開發中...</h2>} />
          <Route path="/faq" element={<h2>常見問題頁面開發中...</h2>} />

          {/* User Center */}
          <Route path="/user/account/profile" element={<h2>個人資料編輯頁開發中...</h2>} />
          <Route path="/user/account/address" element={<h2>收件地址管理頁開發中...</h2>} />
          <Route path="/user/orders" element={<h2>訂單列表頁開發中...</h2>} />
          <Route path="/user/order/:order_id" element={<h2>訂單詳情頁開發中...</h2>} />

          {/* Seller Pages */}
          <Route path="/seller/center" element={<h2>賣家中心首頁開發中...</h2>} />
          <Route path="/seller/store-settings" element={<h2>商店設定頁面開發中...</h2>} />
          <Route path="/seller/products" element={<h2>商品管理頁面開發中...</h2>} />
          <Route path="/seller/product/new" element={<h2>新增商品頁面開發中...</h2>} />
          <Route path="/seller/product/edit/:product_id" element={<h2>商品編輯頁面開發中...</h2>} />
          <Route path="/seller/orders" element={<h2>賣家訂單管理頁面開發中...</h2>} />
          <Route path="/seller/order/:order_id" element={<h2>賣家訂單詳情頁面開發中...</h2>} />
          <Route path="/seller/discounts" element={<h2>折扣管理頁面開發中...</h2>} />

          {/* Admin Pages */}
          <Route path="/admin" element={<h2>管理員首頁開發中...</h2>} />
          <Route path="/admin/users" element={<h2>使用者管理頁面開發中...</h2>} />
          <Route path="/admin/sellers" element={<h2>賣家審核頁面開發中...</h2>} />
          <Route path="/admin/products" element={<h2>商品審核頁面開發中...</h2>} />
          <Route path="/admin/disputes" element={<h2>訂單爭議處理頁面開發中...</h2>} />
          <Route path="/admin/discounts" element={<h2>系統折扣設定頁面開發中...</h2>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
