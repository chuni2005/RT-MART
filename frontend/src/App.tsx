import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./shared/contexts/AuthContext";
import { CartProvider } from "./shared/contexts/CartContext";
import Header from "./shared/components/Header";
import ProtectedRoute from "./shared/components/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import ProductDetail from "./pages/Product";
import Store from "./pages/Store";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import FAQ from "./pages/FAQ/FAQ";
import "./shared/lib/iconLibrary";
import UserCenter from "./pages/UserCenter/UserCenter";
import ProfilePage from "./pages/UserCenter/components/ProfilePage";
import AddressPage from "./pages/UserCenter/components/AddressPage";
import OrderListPage from "./pages/UserCenter/components/OrderListPage";
import OrderDetailPage from "./pages/UserCenter/components/OrderDetailPage";
import SellerCenter from "./pages/Seller";
import Dashboard from "./pages/Seller/components/Dashboard";
import StoreSettings from "./pages/Seller/components/StoreSettings";
import { ProductList, ProductEdit } from "./pages/Seller/components/ProductManagement";
import { OrderList as SellerOrderList, OrderDetail as SellerOrderDetail } from "./pages/Seller/components/OrderManagement";
import { DiscountList, DiscountEdit } from "./pages/Seller/components/DiscountManagement";

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
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="/faq" element={<FAQ />} />

          {/* User Center */}
          <Route path="/user/*"
            element={
              <ProtectedRoute>
                <UserCenter />
              </ProtectedRoute>
            }
          >
            {/* User Account Routes */}
            <Route path="account/profile" element={<ProfilePage />} />
            <Route path="account/address" element={<AddressPage />} />

            {/* Order Routes */}
            <Route path="orders" element={<OrderListPage />} />
            <Route path="orders/:order_id" element={<OrderDetailPage />} />
          </Route>

          {/* Seller Center */}
          <Route path="/seller/*"
            element={
              <ProtectedRoute>
                <SellerCenter />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="center" element={<Dashboard />} />

            {/* Store Management */}
            <Route path="store-settings" element={<StoreSettings />} />

            {/* Product Management */}
            <Route path="products" element={<ProductList />} />
            <Route path="product/new" element={<ProductEdit />} />
            <Route path="product/edit/:productId" element={<ProductEdit />} />

            {/* Order Management */}
            <Route path="orders" element={<SellerOrderList />} />
            <Route path="order/:orderId" element={<SellerOrderDetail />} />

            {/* Discount Management */}
            <Route path="discounts" element={<DiscountList />} />
            <Route path="discount/new" element={<DiscountEdit />} />
            <Route path="discount/edit/:discountId" element={<DiscountEdit />} />
          </Route>

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
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
