import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut, FiPackage, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';

export const Navbar = ({ onOpenCart }) => {
  const { cartItems } = useCart();
  const { currentUser, isAdmin, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(null); // 'signin' | 'signup'
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';
  // Allow search bar everywhere
  const showSearchBar = true;
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const isGuest = !currentUser;
  const isMockAdmin = currentUser?.uid === 'mock-admin';

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

      <nav className="sticky top-0 z-30 bg-pk-accent text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <div className="bg-white p-1 rounded-full shadow-sm group-hover:scale-105 transition-transform">
                <img src="/logo.png" alt="Popular Kitchen Logo" className="h-8 w-8 object-contain" onError={e => e.target.style.display='none'} />
              </div>
              <span className="font-bold text-lg hidden sm:block tracking-wide">Popular Kitchen</span>
            </Link>

            {/* Desktop Search */}
            {showSearchBar && (
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8 relative">
                <input
                  type="text"
                  placeholder="Search kitchenware, appliances..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-white/70 rounded-full py-2 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-white border border-white/20 text-sm backdrop-blur-sm transition-all focus:bg-white focus:text-pk-text-main focus:placeholder-pk-text-muted"
                />
                <button type="submit" className="absolute right-2 top-1.5 p-1.5 text-white/70 hover:text-white rounded-full transition-colors">
                  <FiSearch className="text-inherit" />
                </button>
              </form>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-3">

              {/* Mobile search */}
              {showSearchBar && (
                <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="md:hidden text-white/80 hover:text-white p-2">
                  <FiSearch size={22} />
                </button>
              )}

              {/* Admin badge */}
              {isAdmin && !isMockAdmin && (
                <Link to="/admin/dashboard" className="hidden sm:flex text-xs bg-white text-pk-accent px-4 py-1.5 rounded-full hover:bg-gray-100 transition-colors font-bold shadow-sm">
                  Admin
                </Link>
              )}
              {isMockAdmin && (
                <Link to="/admin/dashboard" className="hidden sm:flex text-xs bg-white text-pk-accent px-4 py-1.5 rounded-full hover:bg-gray-100 transition-colors font-bold shadow-sm">
                  Admin
                </Link>
              )}

              {/* Auth buttons for guest */}
              {isGuest ? (
                <div className="hidden sm:flex items-center gap-3">
                  <button
                    onClick={() => setShowAuth('signin')}
                    className="text-sm px-4 py-1.5 text-white hover:text-gray-200 border border-white/30 rounded-full transition-colors font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowAuth('signup')}
                    className="text-sm px-4 py-1.5 bg-white text-pk-accent rounded-full hover:bg-gray-100 transition-colors font-bold shadow-sm"
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                /* User menu */
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm text-white hover:bg-white/20 transition-colors"
                  >
                    <FiUser size={16} />
                    <span className="max-w-[100px] truncate font-medium">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-11 bg-pk-surface border border-pk-bg-secondary rounded-xl shadow-xl w-48 py-2 z-50 text-pk-text-main">
                      <Link to="/my-orders" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-pk-text-main hover:bg-pk-bg-primary transition-colors">
                        <FiPackage size={15} /> My Orders
                      </Link>
                      <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-pk-error hover:bg-pk-bg-primary transition-colors">
                        <FiLogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cart */}
              <button onClick={onOpenCart} className="relative p-2 text-white hover:text-gray-200 transition-colors">
                <FiShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-pk-error rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-pk-accent shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button className="sm:hidden text-white p-2 hover:text-gray-200" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {showSearchBar && isSearchOpen && (
            <form onSubmit={handleSearch} className="md:hidden pb-4 px-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full bg-white text-pk-text-main rounded-xl py-3 pl-4 pr-12 focus:outline-none border-none text-sm shadow-sm"
                />
                <button type="submit" className="absolute right-3 top-2.5 p-1 text-pk-accent">
                  <FiSearch size={20} />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden absolute top-full left-0 w-full bg-pk-surface border-b border-pk-bg-secondary flex flex-col shadow-xl z-40 max-h-[80vh] overflow-y-auto">
            {(isAdmin || isMockAdmin) && (
              <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="py-4 px-6 text-sm font-bold text-pk-accent border-b border-pk-bg-secondary">
                Admin Dashboard
              </Link>
            )}
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="py-4 px-6 text-sm font-medium text-pk-text-main border-b border-pk-bg-secondary flex items-center justify-between">
              Home <FiArrowRight size={16} className="text-pk-text-muted"/>
            </Link>
            <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="py-4 px-6 text-sm font-medium text-pk-text-main border-b border-pk-bg-secondary flex items-center justify-between">
              My Orders <FiArrowRight size={16} className="text-pk-text-muted"/>
            </Link>

            {isGuest ? (
              <div className="flex gap-3 px-6 py-5 bg-pk-bg-secondary/30">
                <button onClick={() => { setShowAuth('signin'); setIsMobileMenuOpen(false); }} className="flex-1 py-2.5 border-2 border-pk-accent text-pk-accent rounded-xl text-sm font-bold bg-transparent">Sign In</button>
                <button onClick={() => { setShowAuth('signup'); setIsMobileMenuOpen(false); }} className="flex-1 py-2.5 bg-pk-accent text-white rounded-xl text-sm font-bold shadow-md">Sign Up</button>
              </div>
            ) : (
              <div className="px-6 py-5 bg-pk-bg-secondary/30 flex justify-center">
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full py-3 bg-white text-pk-error border border-white text-center rounded-xl font-bold shadow-sm">Sign Out</button>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
};
