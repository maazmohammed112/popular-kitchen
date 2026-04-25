import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct } from '../firebase/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';
import { SEO } from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Module-level cache — survives React re-renders and back-navigation within the same session
let cachedProducts = null;
let cachedCategories = null;

export default function Home() {
  // Initialise state from cache immediately (no skeleton on back-nav)
  const [products, setProducts] = useState(cachedProducts || []);
  const [loading, setLoading] = useState(!cachedProducts);
  const [categories, setCategories] = useState(cachedCategories || ['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Auto-redirect Admin to Dashboard ONLY on first landing
  useEffect(() => {
    const hasVisitedDashboard = sessionStorage.getItem('pk_admin_visited');
    if (isAdmin && !hasVisitedDashboard) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAdmin, navigate]);

  const handleAdminEdit = (product) => {
    // Navigate to admin products, passing the product to pre-open edit modal
    // The referrer is saved so admin can come back
    navigate('/admin/products', { state: { editProductId: product.id } });
  };

  const handleAdminDelete = async (productId) => {
    const backup = [...products];
    setProducts(prev => prev.filter(p => p.id !== productId));
    cachedProducts = products.filter(p => p.id !== productId);
    showSuccess('Deleting product...');
    try {
      await deleteProduct(productId);
      showSuccess('Product deleted');
    } catch {
      showError('Delete failed. Reverting...');
      setProducts(backup);
      cachedProducts = backup;
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
        cachedProducts = data;
        const uniqueCategories = ['All', ...new Set(data.map(p => p.category?.trim()).filter(Boolean))];
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
        title="Primkart Kitchenware Bangalore | Kitchen Items in Shivajinagar"
        description="Buy premium kitchen tools, restaurant equipment, and cookware in Bangalore. Trusted kitchenware supplier in Shivajinagar. Fast delivery across Bangalore."
        url="https://primkart.app/"
      />
      
      <h1 className="sr-only">Kitchenware Store in Bangalore – Primkart Kitchenware Shivajinagar</h1>
      
      {/* Hero Banner Image */}
      <div
        className="w-full mb-8 rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-shadow"
        onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <img
          src="/hero-banner.png"
          alt="Primkart Kitchenware Bangalore – Premium kitchen tools and restaurant equipment in Shivajinagar"
          className="w-full h-auto block"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/* SEO Content Paragraph */}
      <div className="bg-pk-surface rounded-2xl p-5 mb-6 border border-pk-bg-secondary">
        <p className="text-sm text-pk-text-muted leading-relaxed">
          <strong className="text-pk-text-main">Primkart Kitchenware</strong> is a trusted kitchen equipment supplier in Shivajinagar, Bangalore, offering a wide range of kitchen tools, restaurant equipment, and commercial cooking essentials. From induction stoves, hand blenders, and gas lighters to barbecue tools and shawarma machines, we serve homes, hotels, and restaurants across Bangalore.
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
