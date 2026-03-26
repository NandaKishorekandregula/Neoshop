import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';

// --- COMMON COMPONENTS ---
import Navbar from './components/2d/common/Navbar';
import Footer from './components/2d/common/Footer';
import Global3DOverlay from './components/3d/Global3DOverlay';
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';

// --- 2D PAGES ---
import LandingPage2D from './pages/2d/LandingPage';
import Products2D from './pages/2d/Products';
import Profile2D from './pages/2d/Profile';
import Cart2D from './pages/2d/Cart';
import Checkout2D from './pages/2d/Checkout';

// --- 3D PAGES ---
import LandingPage3D from './pages/3d/LandingPage3D';
import Products3D from './pages/3d/Products3D';
import Profile3D from './pages/3d/Profile3D';
import Cart3D from './pages/3d/Cart3D';
import Checkout3D from './pages/3d/Checkout3D';

// --- SHARED / STANDARD PAGES ---
import ProductDetail from './pages/2d/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';

// --- ADMIN SECTION ---
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// --- AI SECTION ---
import AIAnalysis from './pages/AIAnalysis';

function App() {
  // 🌟 Initialize state by checking localStorage first
  const [is3DMode, setIs3DMode] = useState(() => {
    const savedMode = localStorage.getItem('is3DMode');
    return savedMode !== null ? JSON.parse(savedMode) : true;
  });

  // 🌟 Save preference on change
  useEffect(() => {
    localStorage.setItem('is3DMode', JSON.stringify(is3DMode));
  }, [is3DMode]);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  // 🌟 Force 2D mode for admins
  useEffect(() => {
    if (isAdmin) {
      setIs3DMode(false);
    }
  }, [isAdmin]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar is3DMode={is3DMode} />

        {/* Persistent 3D Overlay - hidden for admins */}
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
            <Route path="/products" element={is3DMode ? <Products3D /> : <Products2D />} />
            <Route path="/profile" element={is3DMode ? <Profile3D /> : <Profile2D />} />
            <Route path="/cart" element={is3DMode ? <Cart3D /> : <Cart2D />} />
            <Route path="/checkout" element={is3DMode ? <Checkout3D /> : <Checkout2D />} />

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
            <Route path="/ai-advisor" element={<AIAnalysis />} />
          </Routes>
        </main>

        <Footer is3DMode={is3DMode} />
      </div>
    </Router>
  );
}

export default App;