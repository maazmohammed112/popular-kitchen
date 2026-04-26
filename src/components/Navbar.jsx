import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut, FiPackage, FiArrowRight, FiChevronDown, FiFilter, FiArrowLeft, FiClock, FiAlertTriangle, FiChevronRight } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { getProducts } from '../firebase/products';

let productsCache = null;

export const Navbar = ({ onOpenCart }) => {
  const { cartItems } = useCart();
  const { currentUser, isAdmin, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthEvent = (e) => {
      setShowAuth(e.detail || 'signin');
    };
    window.addEventListener('show-auth-modal', handleAuthEvent);
    
    const fetchProducts = async () => {
      if (productsCache) {
        setAllProducts(productsCache);
        return;
      }
      try {
        const data = await getProducts();
        productsCache = data;
        setAllProducts(data);
      } catch (err) { }
    };
    fetchProducts();

    return () => window.removeEventListener('show-auth-modal', handleAuthEvent);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!debouncedTerm.trim()) {
      setSuggestions([]);
      return;
    }

    const query = debouncedTerm.toLowerCase();
    const filtered = allProducts.filter(p => 
      p.title?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    ).slice(0, 6); 
    
    setSuggestions(filtered);
  }, [debouncedTerm, allProducts]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const isGuest = !currentUser;

  const handleDeleteAccount = () => {
    const subject = encodeURIComponent(`Account Deletion Request - ${currentUser.uid}`);
    const body = encodeURIComponent(
      `Hello Primkart Team,\n\nI would like to request the permanent deletion of my account and all associated data.\n\nAccount Details:\n- User ID: ${currentUser.uid}\n- Email: ${currentUser.email || 'N/A'}\n- Phone: ${currentUser.phoneNumber || 'N/A'}\n\nI understand that my account will be deleted permanently within 2-3 business days.`
    );
    window.location.href = `mailto:info@primkart.app?subject=${subject}&body=${body}`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (product) => {
    navigate(`/product/${product.id}`);
    setSearchTerm('');
    setShowSuggestions(false);
    setIsSearchOpen(false);
  };

  return (
    <>
      {showAuth && <AuthModal defaultTab={showAuth} onClose={() => setShowAuth(null)} />}

      <nav className="sticky top-0 z-30 shadow-sm" style={{ background: 'var(--color-primary)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="bg-white p-1.5 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
                <img src="/logo.png" alt="Primkart Kitchenware Logo" className="h-7 w-7 object-contain" onError={e => e.target.style.display='none'} />
              </div>
              <span className="font-bold text-base hidden sm:block text-white tracking-tight">Primkart Kitchenware</span>
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 mx-8 relative">
              <div className="relative w-full group">
                <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-pk-accent transition-colors" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-white/50 rounded-xl py-2.5 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/15 text-sm backdrop-blur-sm transition-all focus:bg-white focus:text-pk-text-main focus:placeholder-pk-text-muted"
                />
                
                {showSuggestions && searchTerm.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-pk-surface border border-pk-bg-secondary rounded-2xl shadow-2xl overflow-hidden z-50 animate-[scaleIn_0.2s_ease-out]">
                    {suggestions.length > 0 ? (
                      <>
                        <div className="p-3 bg-pk-bg-secondary/30 flex justify-between items-center border-b border-pk-bg-secondary">
                          <span className="text-[10px] font-bold text-pk-text-muted uppercase tracking-widest">Suggestions</span>
                        </div>
                        {suggestions.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSuggestionClick(p)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-pk-bg-primary transition-colors text-left border-b border-pk-bg-secondary/50 last:border-0"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-pk-bg-secondary flex-shrink-0">
                              <img src={p.images?.[0] || p.image} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-pk-text-main truncate">{p.title}</p>
                              <p className="text-[10px] text-pk-text-muted">{p.category}</p>
                            </div>
                            <div className="text-xs font-bold text-pk-accent">
                              ₹{p.discountPrice || p.price || (p.sizes?.[0]?.price) || 0}
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="p-6 text-center text-xs text-pk-text-muted">No exact matches</div>
                    )}
                  </div>
                )}
              </div>
              {showSuggestions && <div className="fixed inset-0 z-[-1]" onClick={() => setShowSuggestions(false)} />}
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="md:hidden text-white/80 hover:text-white p-2">
                <FiSearch size={20} />
              </button>

              {isAdmin && (
                <Link to="/admin/dashboard" className="hidden sm:block text-xs font-bold px-3 py-1.5 rounded-lg bg-pk-accent text-white">
                  Admin
                </Link>
              )}

              {isGuest ? (
                <div className="hidden sm:flex items-center gap-2">
                  <button onClick={() => setShowAuth('signin')} className="text-sm text-white/90 px-3 py-1.5 border border-white/20 rounded-lg">Sign In</button>
                  <button onClick={() => setShowAuth('signup')} className="text-sm bg-white px-3 py-1.5 rounded-lg font-bold" style={{ color: 'var(--color-primary)' }}>Sign Up</button>
                </div>
              ) : (
                <div className="hidden sm:block relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-pk-accent">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                    <FiChevronDown size={14} />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-11 bg-pk-surface border border-pk-bg-secondary rounded-xl shadow-xl w-52 py-1.5 z-50 text-pk-text-main">
                      <Link to="/my-orders" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-pk-bg-primary transition-colors">
                        <FiPackage size={15} /> My Orders
                      </Link>
                      <button onClick={() => { setShowProfileModal(true); setShowUserMenu(false); }} className="w-full flex items-center px-4 py-2.5 text-sm hover:bg-pk-bg-primary text-left">
                        Account Settings
                      </button>
                      <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-pk-bg-primary text-pk-error border-t border-pk-bg-secondary mt-1">
                        <FiLogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button onClick={onOpenCart} className="relative p-2 text-white">
                <FiShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 rounded-full text-[10px] font-bold bg-pk-accent flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              <button className="sm:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Search Input */}
          {isSearchOpen && (
            <div className="md:hidden pb-3">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white rounded-xl py-2 px-4 text-sm"
                />
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu Slide-out */}
        {isMobileMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 w-full bg-pk-surface border-b border-pk-bg-secondary shadow-xl z-40">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block p-4 text-sm font-medium border-b border-pk-bg-secondary text-pk-text-main">Home</Link>
            <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="block p-4 text-sm font-medium border-b border-pk-bg-secondary text-pk-text-main">My Orders</Link>
            <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="block p-4 text-sm font-medium border-b border-pk-bg-secondary text-pk-text-main">About Us</Link>
            
            {!currentUser ? (
              <div className="p-4 flex gap-2">
                <button onClick={() => { setShowAuth('signin'); setIsMobileMenuOpen(false); }} className="flex-1 py-2 border rounded-lg text-sm font-bold text-pk-primary">Sign In</button>
                <button onClick={() => { setShowAuth('signup'); setIsMobileMenuOpen(false); }} className="flex-1 py-2 bg-pk-primary text-white rounded-lg text-sm font-bold">Sign Up</button>
              </div>
            ) : (
              <div className="p-4 bg-pk-bg-secondary/20">
                <p className="text-xs font-bold mb-3">{currentUser.displayName || currentUser.email}</p>
                <button onClick={() => { setShowProfileModal(true); setIsMobileMenuOpen(false); }} className="w-full py-3 px-4 bg-pk-surface border border-pk-bg-secondary rounded-xl flex justify-between items-center text-sm font-bold mb-2">
                  Account Settings <FiChevronRight size={16} />
                </button>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full py-3 bg-pk-error/10 text-pk-error rounded-xl font-bold text-sm">Sign Out</button>
              </div>
            )}
          </div>
        )}

        {/* Account Deletion / Profile Modal */}
        {showProfileModal && currentUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-pk-surface w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-pk-bg-secondary flex justify-between items-center">
                <h3 className="text-xl font-bold">Account Settings</h3>
                <button onClick={() => setShowProfileModal(false)}><FiX size={24} /></button>
              </div>
              <div className="p-8">
                <div className="space-y-4 mb-8">
                  <div><label className="text-[10px] uppercase font-bold text-pk-text-muted">User Name</label><p>{currentUser.displayName || 'Customer'}</p></div>
                  <div><label className="text-[10px] uppercase font-bold text-pk-text-muted">Email</label><p>{currentUser.email || 'N/A'}</p></div>
                </div>
                <div className="p-5 bg-pk-error/5 border border-pk-error/20 rounded-2xl">
                  <h4 className="text-pk-error font-bold text-sm flex items-center gap-2 mb-2"><FiAlertTriangle /> Danger Zone</h4>
                  <p className="text-xs text-pk-text-muted mb-4">Account will be deleted permanently in 2-3 business days.</p>
                  <button onClick={handleDeleteAccount} className="w-full py-3 bg-pk-error text-white rounded-xl font-bold">Delete My Account</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
