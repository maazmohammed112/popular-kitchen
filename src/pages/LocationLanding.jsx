import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { getProducts } from '../firebase/products';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';
import { SEO } from '../components/SEO';

/**
 * Shared template for all SEO location landing pages.
 * Displays dynamic products from the database with page-specific SEO.
 */
export default function LocationLanding({ config }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getProducts()
      .then(data => {
        // If page has a keyword filter, show matching products first
        if (config.filterKeyword) {
          const filtered = data.filter(p =>
            p.title?.toLowerCase().includes(config.filterKeyword) ||
            p.category?.toLowerCase().includes(config.filterKeyword)
          );
          setProducts(filtered.length > 0 ? filtered : data);
        } else {
          setProducts(data);
        }
      })
      .finally(() => setLoading(false));
  }, [config.filterKeyword]);

  const displayedProducts = searchQuery.trim()
    ? products.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <div className="flex flex-col animate-[slideUp_0.4s_ease-out]">
      <SEO
        title={config.title}
        description={config.description}
        url={`https://popularkitchen.store${config.path}`}
      />

      {/* Hero Section */}
      <div className="bg-pk-surface rounded-3xl p-8 mb-8 border border-pk-bg-secondary">
        <div className="max-w-3xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-pk-text-muted mb-4">
            <Link to="/" className="hover:text-pk-accent transition-colors">Home</Link>
            <span>/</span>
            <span className="text-pk-text-main">{config.breadcrumb}</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-pk-text-main mb-4 leading-tight">
            {config.h1}
          </h1>
          <p className="text-pk-text-muted leading-relaxed text-sm md:text-base">
            {config.paragraph}
          </p>

          {/* Search bar */}
          <div className="relative mt-6 max-w-xl">
            <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pk-text-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={config.searchPlaceholder || "Search products..."}
              className="w-full bg-pk-bg-primary border border-pk-bg-secondary rounded-2xl py-3 pl-11 pr-4 text-pk-text-main focus:outline-none focus:border-pk-accent focus:ring-1 focus:ring-pk-accent transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Product Count Info */}
      {!loading && (
        <p className="text-xs text-pk-text-muted mb-6">
          Showing <strong>{displayedProducts.length}</strong> products available in Bangalore
        </p>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)
        ) : displayedProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-pk-text-muted bg-pk-surface rounded-2xl">
            No products found matching your search.
          </div>
        ) : (
          displayedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>

      {/* SEO Footer Text */}
      <div className="mt-12 p-6 bg-pk-surface rounded-3xl border border-pk-bg-secondary">
        <h2 className="text-lg font-bold text-pk-text-main mb-3">
          {config.footerH2 || `About Popular Kitchenware – ${config.breadcrumb}`}
        </h2>
        <p className="text-sm text-pk-text-muted leading-relaxed">
          {config.footerParagraph || config.paragraph}
        </p>
        <div className="mt-4 text-xs text-pk-text-muted">
          📍 363/3, Jumma Masjid Road, Shivaji Nagar, Bengaluru – 560001 &nbsp;|&nbsp;
          📞 <a href="tel:+918892836046" className="hover:text-pk-accent transition-colors">+91 88928 36046</a>
        </div>
      </div>
    </div>
  );
}
