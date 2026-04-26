import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut, FiPackage, FiArrowRight, FiChevronDown, FiFilter, FiArrowLeft, FiClock, FiAlertTriangle } from 'react-icons/fi';
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
    
    // Fetch products for search suggestions
    const fetchProducts = async () => {
      if (productsCache) {
        setAllProducts(productsCache);
        return;
      }
      try {
        const data = await getProducts();
        productsCache = data;
        setAllProducts(data);
      } catch (err) { console.error("Search fetch error:", err); }
    };
    fetchProducts();

    return () => window.removeEventListener('show-auth-modal', handleAuthEvent);
  }, []);

  // Debounce search term for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter suggestions in real-time
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
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8 relative">
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
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && searchTerm.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-pk-surface border border-pk-bg-secondary rounded-2xl shadow-2xl overflow-hidden z-50 animate-[scaleIn_0.2s_ease-out]">
                    {suggestions.length > 0 ? (
                      <>
                        <div className="p-3 bg-pk-bg-secondary/30 flex justify-between items-center border-b border-pk-bg-secondary">
                          <span className="text-[10px] font-bold text-pk-text-muted uppercase tracking-widest">Suggestions</span>
                          <span className="text-[10px] text-pk-accent font-medium">Press Enter to search all</span>
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
                              <p className="text-[10px] text-pk-text-muted">
                                {p.category} {p.sizes?.length > 0 && `• ${p.sizes[0].name}`}
                              </p>
                            </div>
                            <div className="text-xs font-bold text-pk-accent">
                              ₹{p.discountPrice || p.price || (p.sizes?.[0]?.price) || 0}
                            </div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-pk-bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                          <FiSearch className="text-pk-text-muted opacity-40" />
                        </div>
                        <p className="text-sm font-medium text-pk-text-main">No exact matches</p>
                        <p className="text-[11px] text-pk-text-muted mt-1">Try a different keyword or press enter to search</p>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="button"
                  onClick={() => navigate(`/search?q=${searchTerm}&showFilters=true`)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white transition-colors"
                  title="Advanced Filters"
                >
                  <FiFilter size={16} />
                </button>
              </div>

              {/* Backdrop to close suggestions when clicking outside */}
              {showSuggestions && <div className="fixed inset-0 z-[-1]" onClick={() => setShowSuggestions(false)} />}
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">

              {/* Mobile search icon */}
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="md:hidden pk-icon-circle text-white/80 hover:text-white hover:bg-white/10 p-2">
                <FiSearch size={20} />
              </button>

              {/* Admin badge */}
              {isAdmin && (
                <Link to="/admin/dashboard" className="hidden sm:flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'var(--color-tertiary)', color: 'white' }}>
                  Admin
                </Link>
              )}

              {/* Auth buttons for guest */}
              {isGuest ? (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => setShowAuth('signin')}
                    className="text-sm px-4 py-1.5 text-white/90 hover:text-white border border-white/25 rounded-lg transition-all font-medium hover:bg-white/10"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowAuth('signup')}
                    className="text-sm px-4 py-1.5 bg-white rounded-lg font-bold transition-all hover:brightness-95 shadow-sm"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                /* User menu */
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--color-tertiary)' }}>
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="max-w-[100px] truncate font-medium text-sm">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                    <FiChevronDown size={14} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-11 bg-pk-surface border border-pk-bg-secondary rounded-xl shadow-xl w-52 py-1.5 z-50 text-pk-text-main overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-pk-bg-secondary mb-1">
                        <p className="text-xs font-bold text-pk-text-main truncate">{currentUser.displayName || 'User'}</p>
                        <p className="text-[10px] text-pk-text-muted truncate">{currentUser.email}</p>
                      </div>
                      <Link to="/my-orders" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-pk-text-main hover:bg-pk-bg-primary transition-colors">
                        <FiPackage size={15} style={{ color: 'var(--color-secondary)' }} /> My Orders
                      </Link>
                      <button
                          onClick={() => { setShowProfileModal(true); setShowUserMenu(false); }}
                          className="flex items-center w-full px-4 py-2 text-sm text-pk-text-main hover:bg-pk-bg-secondary transition-colors"
                        >
                          Account Settings
                        </button>
                      <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-pk-bg-primary transition-colors border-t border-pk-bg-secondary" style={{ color: 'var(--color-error)' }}>
                        <FiLogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cart */}
              <button onClick={onOpenCart} className="relative pk-icon-circle p-2 text-white hover:bg-white/10 transition-all">
                <FiShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-sm"
                    style={{ background: 'var(--color-tertiary)' }}>
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button className="sm:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-all" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {isSearchOpen && (
            <div className="md:hidden pb-3 px-0 relative">
              <form onSubmit={handleSearch} className="relative">
                <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pk-text-muted" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full bg-white text-pk-text-main rounded-xl py-2.5 pl-10 pr-4 focus:outline-none border-none text-sm shadow-sm"
                />
              </form>

              {/* Mobile Suggestions Dropdown */}
              {showSuggestions && searchTerm.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-pk-surface border border-pk-bg-secondary rounded-2xl shadow-2xl overflow-hidden z-50">
                  {suggestions.length > 0 ? (
                    suggestions.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSuggestionClick(p)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-pk-bg-primary transition-colors text-left border-b border-pk-bg-secondary/50 last:border-0"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-pk-bg-secondary flex-shrink-0">
                          <img src={p.images?.[0] || p.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-pk-text-main truncate">{p.title}</p>
                          <p className="text-[10px] text-pk-text-muted">
                            ₹{p.discountPrice || p.price || (p.sizes?.[0]?.price) || 0}
                            {p.sizes?.length > 0 && <span className="opacity-60 ml-1">({p.sizes[0].name})</span>}
                          </p>
                        </div>
                        <FiArrowRight size={14} className="text-pk-text-muted" />
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-pk-text-muted">
                      No matches found for "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 w-full bg-pk-surface border-b border-pk-bg-secondary flex flex-col shadow-xl z-40 max-h-[80vh] overflow-y-auto">
            {isAdmin && (
              <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="py-3.5 px-5 text-sm font-bold border-b border-pk-bg-secondary flex items-center gap-2"
                style={{ color: 'var(--color-tertiary)' }}>
                Admin Dashboard
              </Link>
            )}
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="py-3.5 px-5 text-sm font-medium text-pk-text-main border-b border-pk-bg-secondary flex items-center justify-between hover:bg-pk-bg-primary transition-colors">
              Home <FiArrowRight size={15} className="text-pk-text-muted"/>
            </Link>
            <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="py-3.5 px-5 text-sm font-medium text-pk-text-main border-b border-pk-bg-secondary flex items-center justify-between hover:bg-pk-bg-primary transition-colors">
              My Orders <FiArrowRight size={15} className="text-pk-text-muted"/>
            </Link>
            <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="py-3.5 px-5 text-sm font-medium text-pk-text-main border-b border-pk-bg-secondary flex items-center justify-between hover:bg-pk-bg-primary transition-colors">
              About Us <FiArrowRight size={15} className="text-pk-text-muted"/>
            </Link>

            {isGuest ? (
              <div className="flex gap-3 px-5 py-4 bg-pk-bg-secondary/40">
                <button onClick={() => { setShowAuth('signin'); setIsMobileMenuOpen(false); }} className="flex-1 py-2.5 border-2 rounded-xl text-sm font-bold transition-all"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>Sign In</button>
                <button onClick={() => { setShowAuth('signup'); setIsMobileMenuOpen(false); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all"
                  style={{ background: 'var(--color-primary)' }}>Sign Up</button>
              </div>
            ) : (
              <div className="px-5 py-4 bg-pk-bg-secondary/40 space-y-2">
                <div className="flex items-center gap-2.5 text-sm font-medium text-pk-text-main mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'var(--color-tertiary)' }}>
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="truncate">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                </div>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full py-2.5 bg-pk-error/10 border border-pk-error/20 text-center rounded-xl font-bold text-sm transition-all" style={{ color: 'var(--color-error)' }}>Sign Out</button>
              </div>
            )}
          </div>
        )}

      {/* Profile Modal */}
      {showProfileModal && currentUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-pk-surface w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-pk-bg-secondary animate-[slideUp_0.3s_ease-out]">
            <div className="p-6 border-b border-pk-bg-secondary flex justify-between items-center">
              <h3 className="text-xl font-bold text-pk-text-main">Account Settings</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-pk-text-muted hover:text-pk-text-main p-2">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-8">
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-pk-text-muted font-bold">User Name</label>
                  <p className="text-pk-text-main font-medium">{currentUser.displayName || 'Customer'}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-pk-text-muted font-bold">Email Address</label>
                  <p className="text-pk-text-main font-medium">{currentUser.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-pk-text-muted font-bold">User ID</label>
                  <p className="text-[10px] font-mono text-pk-text-muted truncate bg-pk-bg-secondary p-2 rounded-lg mt-1">{currentUser.uid}</p>
                </div>
              </div>

              <div className="p-5 bg-pk-error/5 border border-pk-error/20 rounded-2xl">
                <h4 className="text-pk-error font-bold text-sm mb-2 flex items-center gap-2">
                  <FiAlertTriangle /> Danger Zone
                </h4>
                <p className="text-xs text-pk-text-muted mb-4 leading-relaxed">
                  Requesting account deletion will remove all your order history and profile data. 
                  <span className="block mt-1 font-semibold text-pk-error">Account will be deleted permanently in 2-3 business days.</span>
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="w-full py-3 bg-pk-error text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-pk-error/20"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Placeholder */}
      <div id="toast-root"></div>
      </nav>
    </>
  );
};
