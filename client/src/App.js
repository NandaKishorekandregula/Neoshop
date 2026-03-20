import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// 🌟 Added useEffect here
import { useState, useEffect } from 'react';
// 🌟 Added the Auth Context to monitor logins globally
import { useAuth } from './context/AuthContext';

// --- COMMON COMPONENTS ---
import Navbar from './components/2d/common/Navbar';
import Footer from './components/2d/common/Footer';
import Global3DOverlay from './components/3d/Global3DOverlay';

// --- 2D PAGES ---
import LandingPage2D from './pages/2d/LandingPage';
import Products2D from './pages/2d/Products';
import Profile2D from './pages/2d/Profile';
import Cart2D from './pages/Cart';
import Checkout2D from './pages/Checkout';

// --- 3D PAGES ---
import LandingPage3D from './pages/3d/LandingPage3D';
import Products3D from './pages/3d/Products3D';
import Profile3D from './pages/3d/Profile3D';
import Cart3D from './pages/3d/Cart3D';
import Checkout3D from './pages/3d/Checkout3D';

// --- SHARED / STANDARD PAGES ---
import ProductDetail from './pages/ProductDetail';

import Login from './pages/Login';
import Register from './pages/Register';

// --- ADMIN SECTION ---
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';

function App() {
  const [is3DMode, setIs3DMode] = useState(true);

  // 🌟 Grab the user from context
  const { user } = useAuth();

  // Check if they are an admin (adjust this if your DB just uses user.isAdmin)
  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  // 🌟 Force 2D mode immediately if an admin logs in
  useEffect(() => {
    if (isAdmin) {
      setIs3DMode(false);
    }
  }, [isAdmin]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">

        {/* 1. The Classic 2D Navbar */}
        <Navbar is3DMode={is3DMode} />

        {/* 2. The Persistent 3D Overlay */}
        {/* 🌟 Hide the entire 3D overlay for admins so the Spatial Navbar doesn't render! */}
        {!isAdmin && (
          <Global3DOverlay is3DMode={is3DMode} setIs3DMode={setIs3DMode} />
        )}

        <main className="flex-grow relative">
          <Routes>

            {/* THE SMART ROUTER */}
            <Route
              path="/"
              element={is3DMode
                ? <LandingPage3D is3DMode={is3DMode} setIs3DMode={setIs3DMode} />
                : <LandingPage2D is3DMode={is3DMode} setIs3DMode={setIs3DMode} />
              }
            />
            <Route
              path="/products"
              element={is3DMode ? <Products3D /> : <Products2D />}
            />
            <Route
              path="/profile"
              element={is3DMode ? <Profile3D /> : <Profile2D />}
            />
            <Route
              path="/cart"
              element={is3DMode ? <Cart3D /> : <Cart2D />}
            />
            <Route
              path="/checkout"
              element={is3DMode ? <Checkout3D /> : <Checkout2D />}
            />

            {/* Standard Pages */}
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="/products" element={<AdminProducts />} />
                      <Route path="/orders" element={<AdminOrders />} />
                      <Route path="/users" element={<AdminUsers />} />
                      <Route path="/analytics" element={<AdminAnalytics />} />
                    </Routes>
                  </AdminLayout>
                </AdminRoute>
              }
            />

          </Routes>
        </main>

        <Footer is3DMode={is3DMode} />
      </div>
    </Router>
  );
}

export default App;