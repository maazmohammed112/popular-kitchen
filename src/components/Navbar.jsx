import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut, FiPackage, FiArrowRight, FiChevronDown } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';

export const Navbar = ({ onOpenCart }) => {
  const { cartItems } = useCart();
  const { currentUser, isAdmin, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
    return () => window.removeEventListener('show-auth-modal', handleAuthEvent);
  }, []);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const isGuest = !currentUser;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchOpen(false);
    }
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
                <img src="/logo.png" alt="Popular Kitchen Logo" className="h-7 w-7 object-contain" onError={e => e.target.style.display='none'} />
              </div>
              <span className="font-bold text-base hidden sm:block text-white tracking-tight">Popular Kitchen</span>
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8 relative">
              <div className="relative w-full">
                <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  placeholder="Search kitchenware, appliances..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-white/50 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/15 text-sm backdrop-blur-sm transition-all focus:bg-white focus:text-pk-text-main focus:placeholder-pk-text-muted"
                />
              </div>
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
                      <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-pk-bg-primary transition-colors" style={{ color: 'var(--color-error)' }}>
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
            <form onSubmit={handleSearch} className="md:hidden pb-3 px-0">
              <div className="relative">
                <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full bg-white text-pk-text-main rounded-xl py-2.5 pl-10 pr-4 focus:outline-none border-none text-sm shadow-sm"
                />
              </div>
            </form>
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
      </nav>
    </>
  );
};
