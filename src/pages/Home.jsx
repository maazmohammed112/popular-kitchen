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
      {/* Hero Banner Image */}
      <div
        className="w-full mb-8 rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-shadow"
        onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <img
          src="/hero-banner.png"
          alt="Popular Kitchen - Premium Kitchenware Store Bangalore"
          className="w-full object-cover max-h-[420px] block"
        />
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
                : 'bg-pk-surface text-pk-text-muted hover:text-pk-text-main'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <div id="products-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
