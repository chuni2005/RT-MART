import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./shared/contexts/AuthContext";
import Header from "./shared/components/Header/Header";
import Home from "./pages/Home/Home";
import Auth from "./pages/Auth/Auth";
import "./shared/lib/iconLibrary";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/products" element={<h2>商品頁面開發中...</h2>} />
              <Route path="/categories" element={<h2>分類頁面開發中...</h2>} />
              <Route path="/deals" element={<h2>優惠活動頁面開發中...</h2>} />
              <Route path="/about" element={<h2>關於我們頁面開發中...</h2>} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
