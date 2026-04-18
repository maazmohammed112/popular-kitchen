import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut, FiPackage } from 'react-icons/fi';
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

  const isHome = location.pathname === '/';
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const isGuest = !currentUser;
  const isMockAdmin = currentUser?.uid === 'mock-admin';

  return (
    <>
      {showAuth && <AuthModal defaultTab={showAuth} onClose={() => setShowAuth(null)} />}

      <nav className="sticky top-0 z-30 bg-pk-bg-primary/95 backdrop-blur-md border-b border-pk-bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo.png" alt="Popular Kitchen Logo" className="h-8 object-contain" onError={e => e.target.style.display='none'} />
              <span className="font-bold text-lg hidden sm:block tracking-wide">Popular Kitchen</span>
            </Link>

            {/* Desktop Search */}
            {isHome && (
              <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-pk-bg-secondary text-pk-text-main rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-pk-accent border-none text-sm"
                />
                <FiSearch className="absolute right-4 top-2.5 text-pk-text-muted" />
              </div>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2">

              {/* Mobile search */}
              {isHome && (
                <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="md:hidden text-pk-text-muted hover:text-pk-text-main p-2">
                  <FiSearch size={20} />
                </button>
              )}

              {/* Admin badge */}
              {isAdmin && !isMockAdmin && (
                <Link to="/admin/dashboard" className="hidden sm:flex text-xs bg-pk-accent/10 text-pk-accent px-3 py-1.5 rounded-full hover:bg-pk-accent hover:text-white transition-colors font-medium">
                  Admin
                </Link>
              )}
              {isMockAdmin && (
                <Link to="/admin/dashboard" className="hidden sm:flex text-xs bg-pk-accent/10 text-pk-accent px-3 py-1.5 rounded-full hover:bg-pk-accent hover:text-white transition-colors font-medium">
                  Admin
                </Link>
              )}

              {/* Auth buttons for guest */}
              {isGuest ? (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => setShowAuth('signin')}
                    className="text-sm px-3 py-1.5 text-pk-text-muted hover:text-pk-text-main border border-pk-bg-secondary rounded-full transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowAuth('signup')}
                    className="text-sm px-3 py-1.5 bg-pk-accent text-white rounded-full hover:bg-blue-600 transition-colors font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                /* User menu */
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-pk-bg-secondary rounded-full text-sm text-pk-text-main hover:bg-pk-surface transition-colors"
                  >
                    <FiUser size={16} />
                    <span className="max-w-[100px] truncate">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-10 bg-pk-surface border border-pk-bg-secondary rounded-xl shadow-xl w-48 py-2 z-50">
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
              <button onClick={onOpenCart} className="relative p-2 text-pk-text-muted hover:text-pk-text-main">
                <FiShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-pk-accent rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button className="sm:hidden text-pk-text-muted p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {isHome && isSearchOpen && (
            <div className="md:hidden pb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full bg-pk-bg-secondary text-pk-text-main rounded-xl py-3 pl-4 pr-10 focus:outline-none border-none text-sm"
                />
                <FiSearch className="absolute right-4 top-3.5 text-pk-text-muted" />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden absolute top-16 left-0 w-full bg-pk-surface border-b border-pk-bg-secondary flex flex-col shadow-xl z-40">
            {(isAdmin || isMockAdmin) && (
              <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="py-3 px-4 text-sm font-medium text-pk-text-main border-b border-pk-bg-secondary">
                Admin Dashboard
              </Link>
            )}
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="py-3 px-4 text-sm font-medium text-pk-text-main border-b border-pk-bg-secondary">Home</Link>
            <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="py-3 px-4 text-sm font-medium text-pk-text-main border-b border-pk-bg-secondary">My Orders</Link>

            {isGuest ? (
              <div className="flex gap-3 px-4 py-3">
                <button onClick={() => { setShowAuth('signin'); setIsMobileMenuOpen(false); }} className="flex-1 py-2 border border-pk-bg-secondary rounded-xl text-sm text-pk-text-main">Sign In</button>
                <button onClick={() => { setShowAuth('signup'); setIsMobileMenuOpen(false); }} className="flex-1 py-2 bg-pk-accent text-white rounded-xl text-sm font-medium">Sign Up</button>
              </div>
            ) : (
              <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="py-3 px-4 text-sm text-pk-error text-left">Sign Out</button>
            )}
          </div>
        )}
      </nav>
    </>
  );
};
