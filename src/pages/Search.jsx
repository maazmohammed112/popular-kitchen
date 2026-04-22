import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch, FiFilter, FiRefreshCw, FiChevronDown } from 'react-icons/fi';
import { getProducts, deleteProduct } from '../firebase/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';
import { useAuth } from '../contexts/AuthContext';
import { notifyEmptySearch, notifyGuestSearch } from '../firebase/notifications';
import { useToast } from '../contexts/ToastContext';

// Module-level cache — survives back-navigation within the same session
let allProductsCache = null;

// Session-wide deduplication — stored in sessionStorage so it persists
// across re-renders and component remounts within the same browser tab.
const SESSION_KEY = 'pk_notified_searches';

const hasBeenNotified = (key) => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
    return stored.includes(key);
  } catch { return false; }
};

const markAsNotified = (key) => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
    if (!stored.includes(key)) {
      stored.push(key);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored));
    }
  } catch { /* ignore storage errors */ }
};

export default function Search() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  const location = useLocation();
  const navigate = useNavigate();
  
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  const [sortOrder, setSortOrder] = useState(''); // 'low-to-high' | 'high-to-low'
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(searchParams.get('showFilters') === 'true');

  const handleAdminEdit = (product) => {
    navigate('/admin/products', { state: { editProductId: product.id } });
  };

  const handleAdminDelete = async (productId) => {
    const backup = [...products];
    setProducts(prev => prev.filter(p => p.id !== productId));
    if (allProductsCache) allProductsCache = allProductsCache.filter(p => p.id !== productId);
    showSuccess('Deleting product...');
    try {
      await deleteProduct(productId);
      showSuccess('Product deleted');
    } catch {
      showError('Delete failed. Reverting...');
      setProducts(backup);
    }
  };
  
  // Scroll to top when search criteria changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [query, selectedCategory]);

  useEffect(() => {
    const filterProducts = (allProducts) => {
      let filtered = allProducts;
      
      // 1. Text search
      if (query.trim()) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter(p =>
          (p.title && p.title.toLowerCase().includes(lowerQuery)) ||
          (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
          (p.description && p.description.toLowerCase().includes(lowerQuery))
        );
      }

      // 2. Category filter
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category === selectedCategory);
      }

      // 3. Sorting
      if (sortOrder === 'low-to-high') {
        filtered = [...filtered].sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
      } else if (sortOrder === 'high-to-low') {
        filtered = [...filtered].sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
      }

      return filtered;
    };

    const extractCategories = (allProducts) => {
      const unique = [...new Set(allProducts.map(p => p.category))].filter(Boolean);
      setCategories(unique.sort());
    };

    const fetchAndFilterProducts = async () => {
      // Show cached results instantly (no skeleton flash on back-nav)
      if (allProductsCache) {
        setProducts(filterProducts(allProductsCache));
        setLoading(false);
      } else {
        setLoading(true);
      }

      // Always revalidate in background
      try {
        const allProducts = await getProducts();
        allProductsCache = allProducts;
        extractCategories(allProducts);
        setProducts(filterProducts(allProducts));
      } catch (error) {
        console.error("Failed to search products", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndFilterProducts();
  }, [query, sortOrder, selectedCategory]);

  // Single notification effect — fires once per unique query per browser session
  useEffect(() => {
    if (loading || !query.trim()) return;

    const lowerQuery = query.toLowerCase();

    if (products.length === 0) {
      // No results found — alert admin with user info if available
      const key = `empty:${lowerQuery}`;
      if (!hasBeenNotified(key)) {
        markAsNotified(key);
        notifyEmptySearch(query, currentUser);
      }
    } else if (!currentUser) {
      // Results found but user is not logged in — alert admin of guest interest
      const key = `guest:${lowerQuery}`;
      if (!hasBeenNotified(key)) {
        markAsNotified(key);
        notifyGuestSearch(query);
      }
    }
  }, [loading, products, query, currentUser]);

  return (
    <div className="flex flex-col animate-[slideUp_0.4s_ease-out]">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center justify-center w-10 h-10 bg-pk-surface border border-pk-bg-secondary rounded-full hover:bg-pk-bg-secondary text-pk-text-main transition-colors"
          >
            <FiArrowLeft />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-pk-text-main flex items-center gap-2">
            {selectedCategory !== 'all' ? selectedCategory : 'Search Results'} 
            {query && <span className="text-pk-accent font-medium text-xl">"{query}"</span>}
          </h1>
        </div>
        <p className="text-sm text-pk-text-muted">Found {loading ? '...' : products.length} items</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 px-4 py-2 bg-pk-surface border border-pk-bg-secondary rounded-xl text-sm font-semibold text-pk-text-muted hover:text-pk-text-main transition-all"
        >
          Home
        </button>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
            showFilters || sortOrder || selectedCategory !== 'all'
            ? 'bg-pk-accent text-white border-pk-accent shadow-lg shadow-pk-accent/20' 
            : 'bg-pk-surface text-pk-text-main border-pk-bg-secondary hover:bg-pk-bg-secondary'
          }`}
        >
          <FiFilter size={16} /> Filters {(sortOrder || selectedCategory !== 'all') && '•'}
        </button>
      </div>

      {/* Filter Bar (Collapsible) */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 mb-8 p-6 bg-pk-surface border border-pk-bg-secondary rounded-2xl animate-[slideDown_0.2s_ease-out] shadow-sm">
          <div className="flex items-center gap-2 text-pk-text-muted text-xs font-bold uppercase tracking-wider mr-2">
            Sorting & Categories
          </div>

        {/* Sort Select */}
        <div className="relative group">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="appearance-none bg-pk-surface border border-pk-bg-secondary text-pk-text-main text-sm rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-pk-accent transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <option value="">Default Sorting</option>
            <option value="low-to-high">Price: Low to High</option>
            <option value="high-to-low">Price: High to Low</option>
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-pk-text-muted pointer-events-none group-hover:text-pk-accent transition-colors" />
        </div>

        {/* Category Select */}
        <div className="relative group">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none bg-pk-surface border border-pk-bg-secondary text-pk-text-main text-sm rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-pk-accent transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <option value="all">All Categories</option>
            {categories.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>
          <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-pk-text-muted pointer-events-none group-hover:text-pk-accent transition-colors" />
        </div>

        {/* Reset Button */}
        {(sortOrder || selectedCategory !== 'all') && (
          <button
            onClick={() => { setSortOrder(''); setSelectedCategory('all'); }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-pk-error hover:bg-pk-error/10 rounded-xl transition-all border border-pk-error/20 ml-auto"
          >
            <FiRefreshCw className="animate-[spin_2s_linear_infinite]" /> Reset
          </button>
        )}
      </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)
        ) : products.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-pk-surface border border-pk-bg-secondary rounded-3xl flex flex-col items-center justify-center shadow-sm">
            <div className="w-20 h-20 bg-pk-bg-secondary rounded-full flex items-center justify-center mb-4">
              <FiSearch size={32} className="text-pk-text-muted opacity-50" />
            </div>
            <p className="font-semibold text-pk-text-main mb-2 text-lg">No matching products</p>
            <p className="text-sm text-pk-text-muted max-w-md mx-auto">
              We couldn't find anything matching "{query}". Try adjusting your search or browse our categories.
            </p>
            <button 
              onClick={() => navigate('/')} 
              className="mt-6 px-6 py-2.5 bg-pk-accent text-white rounded-full font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-pk-accent/20"
            >
              Back to Home
            </button>
          </div>
        ) : (
          products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={isAdmin ? handleAdminEdit : undefined}
              onDelete={isAdmin ? handleAdminDelete : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
