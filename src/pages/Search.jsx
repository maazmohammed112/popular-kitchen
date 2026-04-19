import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';
import { getProducts } from '../firebase/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';
import { useAuth } from '../contexts/AuthContext';
import { notifyEmptySearch, notifyGuestSearch } from '../firebase/notifications';

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
  const { currentUser } = useAuth();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const fetchAndFilterProducts = async () => {
      setLoading(true);
      try {
        const allProducts = await getProducts();
        
        if (!query.trim()) {
          setProducts(allProducts);
        } else {
          const lowerQuery = query.toLowerCase();
          const filtered = allProducts.filter(p => 
            (p.title && p.title.toLowerCase().includes(lowerQuery)) ||
            (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
            (p.description && p.description.toLowerCase().includes(lowerQuery))
          );
          setProducts(filtered);
        }
      } catch (error) {
        console.error("Failed to search products", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndFilterProducts();
  }, [query]);

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
            Search Results {query && <span className="text-pk-accent font-medium text-xl">"{query}"</span>}
          </h1>
        </div>
        <p className="text-sm text-pk-text-muted">Found {loading ? '...' : products.length} items</p>
      </div>

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
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
}
