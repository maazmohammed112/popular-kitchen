import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';
import { getProducts } from '../firebase/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';
import { useAuth } from '../contexts/AuthContext';
import { notifyEmptySearch } from '../firebase/notifications';
import { useRef } from 'react';

export default function Search() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const notifiedQueries = useRef(new Set());
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract search query from URL
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

  // Notify admin if no results found
  useEffect(() => {
    if (!loading && query.trim() && products.length === 0) {
      if (!notifiedQueries.current.has(query.toLowerCase())) {
        notifiedQueries.current.add(query.toLowerCase());
        notifyEmptySearch(query, currentUser);
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
