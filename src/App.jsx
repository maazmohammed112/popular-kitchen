import { lazy, Suspense, useEffect, useState } from 'react';
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
import { ReloadPrompt } from './components/ReloadPrompt';
import { FiMessageCircle } from 'react-icons/fi';

// Lazy Loaded Pages for "Lightning" Performance
const Home = lazy(() => import('./pages/Home'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ManageProducts = lazy(() => import('./pages/admin/ManageProducts'));
const ManageOrders = lazy(() => import('./pages/admin/ManageOrders'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Support = lazy(() => import('./pages/Support'));
const Search = lazy(() => import('./pages/Search'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const AppLayout = ({ children, setIsCartOpen, toggleTheme }) => {
  return (
    <div className="flex flex-col min-h-screen bg-pk-bg-primary text-pk-text-main transition-colors duration-200">
      <Navbar onOpenCart={() => setIsCartOpen(true)} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      <Footer toggleTheme={toggleTheme} />
      
      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/9108167067?text=Hello%20Popular%20Kitchen!%20I%20have%20an%20inquiry."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform flex items-center justify-center cursor-pointer"
        title="Chat on WhatsApp"
      >
        <FiMessageCircle size={28} />
      </a>
    </div>
  );
};

const DefaultViews = () => {
  const [isLoaderDone, setIsLoaderDone] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('pk_theme') === 'dark';
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pk_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pk_theme', 'dark');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaderDone(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, []);

  if (!isLoaderDone) {
    return <GlobalLoader />;
  }

  return (
    <>
      <WelcomeModal />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ReloadPrompt />
      
      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          <Route path="/" element={<AppLayout setIsCartOpen={setIsCartOpen} toggleTheme={toggleTheme}><Home /></AppLayout>} />
          <Route path="/search" element={<AppLayout setIsCartOpen={setIsCartOpen} toggleTheme={toggleTheme}><Search /></AppLayout>} />
          <Route path="/product/:id" element={<AppLayout setIsCartOpen={setIsCartOpen} toggleTheme={toggleTheme}><ProductDetail setIsCartOpen={setIsCartOpen} /></AppLayout>} />
          <Route path="/checkout" element={<AppLayout setIsCartOpen={setIsCartOpen} toggleTheme={toggleTheme}><Checkout /></AppLayout>} />
          <Route path="/order-success/:id" element={<AppLayout setIsCartOpen={setIsCartOpen} toggleTheme={toggleTheme}><OrderSuccess /></AppLayout>} />
          <Route path="/terms" element={<AppLayout setIsCartOpen={setIsCartOpen} toggleTheme={toggleTheme}><Terms /></AppLayout>} />
          <Route path="/privacy" element={<AppLayout setIsCartOpen={setIsCartOpen} toggleTheme={toggleTheme}><Privacy /></AppLayout>} />
          <Route path="/support" element={<AppLayout setIsCartOpen={setIsCartOpen} toggleTheme={toggleTheme}><Support /></AppLayout>} />
          <Route path="/my-orders" element={<AppLayout setIsCartOpen={setIsCartOpen} toggleTheme={toggleTheme}><MyOrders /></AppLayout>} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<ManageProducts />} />
            <Route path="orders" element={<ManageOrders />} />
          </Route>
          
          <Route path="*" element={<AppLayout setIsCartOpen={setIsCartOpen} toggleTheme={toggleTheme}><NotFound /></AppLayout>} />
        </Routes>
      </Suspense>
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
