import { useState, useEffect } from 'react';
import { getProducts } from '../firebase/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';
import { SEO } from '../components/SEO';

// Module-level cache — survives React re-renders and back-navigation within the same session
let cachedProducts = null;
let cachedCategories = null;

export default function Home() {
  // Initialise state from cache immediately (no skeleton on back-nav)
  const [products, setProducts] = useState(cachedProducts || []);
  const [loading, setLoading] = useState(!cachedProducts);
  const [categories, setCategories] = useState(cachedCategories || ['All']);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
        cachedProducts = data;
        const uniqueCategories = ['All', ...new Set(data.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
        cachedCategories = uniqueCategories;
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
      <SEO 
        title="Popular Kitchenware Bangalore | Kitchen Items in Shivajinagar"
        description="Buy premium kitchen tools, restaurant equipment, and cookware in Bangalore. Trusted kitchenware supplier in Shivajinagar. Fast delivery across Bangalore."
        url="https://popularkitchen.store/"
      />
      
      <h1 className="sr-only">Kitchenware Store in Bangalore – Popular Kitchenware Shivajinagar</h1>
      
      {/* Hero Banner Image */}
      <div
        className="w-full mb-8 rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-shadow"
        onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <img
          src="/hero-banner.png"
          alt="Popular Kitchenware Bangalore – Premium kitchen tools and restaurant equipment in Shivajinagar"
          className="w-full h-auto block"
          loading="eager"
          fetchpriority="high"
        />
      </div>

      {/* SEO Content Paragraph */}
      <div className="bg-pk-surface rounded-2xl p-5 mb-6 border border-pk-bg-secondary">
        <p className="text-sm text-pk-text-muted leading-relaxed">
          <strong className="text-pk-text-main">Popular Kitchenware</strong> is a trusted kitchen equipment supplier in Shivajinagar, Bangalore, offering a wide range of kitchen tools, restaurant equipment, and commercial cooking essentials. From induction stoves, hand blenders, and gas lighters to barbecue tools and shawarma machines, we serve homes, hotels, and restaurants across Bangalore.
        </p>
      </div>
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
