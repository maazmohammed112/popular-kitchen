import { useState, useEffect } from 'react';
import { getProducts } from '../firebase/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
        
        const uniqueCategories = ['All', ...new Set(data.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="flex flex-col animate-[slideUp_0.4s_ease-out]">
      {/* Hero */}
      <div className="w-full bg-pk-surface rounded-3xl overflow-hidden mb-8 relative p-8 md:p-16 text-center border border-pk-bg-secondary flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F2040] to-[#1E90FF] opacity-10"></div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 z-10 tracking-tight">Premium Kitchenware</h1>
        <p className="text-pk-text-muted md:text-lg max-w-2xl z-10">
          Elevate your culinary journey with our curated selection of high-quality tools, cookware, and accessories designed for perfection.
        </p>
      </div>

      {/* Category Filter */}
      {!loading && categories.length > 1 && (
        <div className="flex overflow-x-auto gap-3 pb-4 mb-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat 
                ? 'bg-pk-accent text-white shadow-[0_0_10px_rgba(30,144,255,0.4)]' 
                : 'bg-pk-surface text-pk-text-muted hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-pk-text-muted bg-pk-surface rounded-2xl">
            No products found in this category.
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
}
