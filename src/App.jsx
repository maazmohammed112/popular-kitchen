import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';

// Components
import { GlobalLoader } from './components/GlobalLoader';
import { WelcomeModal } from './components/WelcomeModal';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';

// Pages
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import ManageProducts from './pages/admin/ManageProducts';
import ManageOrders from './pages/admin/ManageOrders';

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const AppLayout = ({ children, setIsCartOpen }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onOpenCart={() => setIsCartOpen(true)} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

const DefaultViews = () => {
  const [isLoaderDone, setIsLoaderDone] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaderDone(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaderDone) {
    return <GlobalLoader />;
  }

  return (
    <>
      <WelcomeModal />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <Routes>
        <Route path="/" element={<AppLayout setIsCartOpen={setIsCartOpen}><Home /></AppLayout>} />
        <Route path="/product/:id" element={<AppLayout setIsCartOpen={setIsCartOpen}><ProductDetail /></AppLayout>} />
        <Route path="/checkout" element={<AppLayout setIsCartOpen={setIsCartOpen}><Checkout /></AppLayout>} />
        <Route path="/order-success/:id" element={<AppLayout setIsCartOpen={setIsCartOpen}><OrderSuccess /></AppLayout>} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><ManageProducts /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><ManageOrders /></AdminRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <DefaultViews />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
