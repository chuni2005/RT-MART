import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./shared/contexts/AuthContext";
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
import {
  ProductList,
  ProductEdit,
} from "./pages/Seller/components/ProductManagement";
import {
  OrderList as SellerOrderList,
  OrderDetail as SellerOrderDetail,
} from "./pages/Seller/components/OrderManagement";
import {
  DiscountList,
  DiscountEdit,
} from "./pages/Seller/components/DiscountManagement";
import SellerApply from "./pages/Seller/Apply";
import AdminCenter from "./pages/Admin";
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminUsers from "./pages/Admin/Users";
import AdminStores from "./pages/Admin/Stores";
import AdminSellers from "./pages/Admin/Sellers";
import AdminOrders from "./pages/Admin/Orders";
import AdminDiscounts from "./pages/Admin/Discounts";
import AdminDiscountEdit from "./pages/Admin/Discounts/DiscountEdit";

// Role-based Home Redirect Component
function RoleBasedHome() {
  const { user } = useAuth();

  // Admin 用户自动重定向到 admin 后台
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  // 买賣家或未登录用户显示正常首页
  return <Home />;
}

// Header Wrapper Component to handle conditional rendering
function AppHeader() {
  const location = useLocation();

  if (location.pathname === "/auth") {
    return <Header variant="simple" />;
  }

  if (
    location.pathname.startsWith("/seller") ||
    location.pathname.startsWith("/admin")
  ) {
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
          <Route path="/" element={<RoleBasedHome />} />
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
            {/* Index redirect */}
            <Route index element={<Navigate to="account/profile" replace />} />

            {/* User Account Routes */}
            <Route path="account/profile" element={<ProfilePage />} />
            <Route path="account/address" element={<AddressPage />} />

            {/* Order Routes */}
            <Route path="orders" element={<OrderListPage />} />
            <Route path="orders/:order_id" element={<OrderDetailPage />} />
          </Route>

          {/* Seller Application (独立路由，不包含在 SellerCenter 布局中) */}
          <Route
            path="/seller/apply"
            element={
              <ProtectedRoute requiredRole="buyer">
                <SellerApply />
              </ProtectedRoute>
            }
          />

          {/* Seller Center */}
          <Route
            path="/seller/*"
            element={
              <ProtectedRoute requiredRole="seller">
                <SellerCenter />
              </ProtectedRoute>
            }
          >
            {/* Index redirect */}
            <Route index element={<Navigate to="center" replace />} />

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
            <Route
              path="discount/edit/:discountId"
              element={<DiscountEdit />}
            />
          </Route>

          {/* Admin Center */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCenter />
              </ProtectedRoute>
            }
          >
            {/* Index redirect */}
            <Route index element={<Navigate to="dashboard" replace />} />

            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="stores" element={<AdminStores />} />
            <Route path="sellers" element={<AdminSellers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="discounts" element={<AdminDiscounts />} />
            <Route path="discount/new" element={<AdminDiscountEdit />} />
            <Route
              path="discount/edit/:discountId"
              element={<AdminDiscountEdit />}
            />
          </Route>
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
