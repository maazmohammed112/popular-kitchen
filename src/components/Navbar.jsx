import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiMenu, FiX, FiUser } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = ({ onOpenCart, onSearch, onCategorySelect, categories = [] }) => {
  const { cartItems } = useCart();
  const { currentUser, isAdmin } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) onSearch(val);
  };

  return (
    <nav className="sticky top-0 z-30 bg-pk-bg-primary/90 backdrop-blur-md border-b border-pk-bg-secondary/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Popular Kitchen Logo" className="h-8 object-contain" onError={(e) => e.target.style.display='none'} />
            <span className="font-bold text-lg hidden sm:block tracking-wide">Popular Kitchen</span>
          </Link>

          {/* Desktop Search */}
          {isHome && (
            <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full bg-pk-bg-secondary text-pk-text-main rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-1 focus:ring-pk-accent border-none text-sm"
              />
              <FiSearch className="absolute right-4 top-2.5 text-pk-text-muted" />
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {isHome && (
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)} 
                className="md:hidden text-pk-text-muted hover:text-white"
              >
                <FiSearch size={20} />
              </button>
            )}
            
            {isAdmin && (
              <Link to="/admin/dashboard" className="hidden sm:flex text-xs bg-pk-surface px-3 py-1.5 rounded-full text-pk-text-muted hover:text-white">
                Admin
              </Link>
            )}

            <button 
              onClick={onOpenCart} 
              className="relative p-2 text-pk-text-muted hover:text-white"
            >
              <FiShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-pk-accent rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            
            <button className="sm:hidden text-pk-text-muted p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Expandable */}
        {isHome && isSearchOpen && (
          <div className="md:hidden pb-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
                className="w-full bg-pk-bg-secondary text-pk-text-main rounded-xl py-3 pl-4 pr-10 focus:outline-none border-none text-sm shadow-inner"
              />
              <FiSearch className="absolute right-4 top-3.5 text-pk-text-muted" />
            </div>
          </div>
        )}

      </div>

      {/* Mobile Menu Box */}
      {isMobileMenuOpen && (
        <div className="sm:hidden absolute top-16 left-0 w-full bg-pk-surface border-b border-pk-bg-secondary flex flex-col p-4 shadow-xl">
          {isAdmin && (
             <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="py-3 px-4 text-sm font-medium text-pk-text-main border-b border-pk-bg-secondary">
               Admin Dashboard
             </Link>
          )}
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="py-3 px-4 text-sm font-medium text-pk-text-main border-b border-pk-bg-secondary">
            Home
          </Link>
          <div className="py-3 px-4 text-sm text-pk-text-muted flex items-center gap-2">
            <FiUser /> {currentUser ? currentUser.email : 'Guest'}
          </div>
        </div>
      )}
    </nav>
  );
};
