import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiMinus, FiPlus, FiShoppingCart, FiX, FiChevronLeft, FiChevronRight, FiArrowRight, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getProduct, getProducts, deleteProduct } from '../firebase/products';
import { useAuth } from '../contexts/AuthContext';
import { calculateDiscountPrice } from '../utils/discountCalc';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { SEO } from '../components/SEO';
import { getOptimizedUrl } from '../cloudinary/upload';
import { ShareButton } from '../components/ShareButton';
import { ImageWithSkeleton } from '../components/ImageWithSkeleton';
import { ProductCard } from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const sizeImages = (product?.sizes || []).map(s => s.image).filter(Boolean);
  const allImages = product ? [...new Set([...(product.images || []), ...sizeImages])] : [];

  const handleImageChange = (newIdx) => {
    setActiveImage(newIdx);
    const currentImg = allImages[newIdx];
    const sizeObj = product?.sizes?.find(s => s.image === currentImg);
    if (sizeObj) setSelectedSize(sizeObj.name);
  };

  const handleSizeSelect = (sizeName) => {
    setSelectedSize(sizeName);
    const sizeObj = product?.sizes?.find(s => s.name === sizeName);
    if (sizeObj && sizeObj.image) {
      const imgIdx = allImages.indexOf(sizeObj.image);
      if (imgIdx !== -1) setActiveImage(imgIdx);
    }
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && activeImage < allImages.length - 1) {
      handleImageChange(activeImage + 1);
    }
    if (isRightSwipe && activeImage > 0) {
      handleImageChange(activeImage - 1);
    }
  };

  const handleImageClick = (e) => {
    if (window.innerWidth < 768) {
      if (allImages.length > 0) setIsLightboxOpen(true);
      return;
    }
    if (allImages.length <= 1) {
      if (allImages.length > 0) setIsLightboxOpen(true);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      if (activeImage > 0) handleImageChange(activeImage - 1);
      else handleImageChange(allImages.length - 1);
    } else {
      if (activeImage < allImages.length - 1) handleImageChange(activeImage + 1);
      else handleImageChange(0);
    }
  };

  // Scroll to top whenever the product id changes (related product click)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProduct(id);
        if (data) {
          const normalizedSizes = (data.sizes || []).map(s => 
            typeof s === 'string' ? { name: s, price: data.discountPrice || data.price } : s
          );
          setProduct({...data, sizes: normalizedSizes});
          if (normalizedSizes.length > 0) {
            setSelectedSize(normalizedSizes[0].name);
          }
          // Fetch related products in same category
          const allProducts = await getProducts();
          const related = allProducts.filter(p => p.id !== id && p.category === data.category).slice(0, 6);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-10 w-24 bg-pk-bg-secondary rounded-lg mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-pk-surface p-6 md:p-8 rounded-3xl border border-pk-bg-secondary">
          <div className="aspect-square bg-pk-bg-primary rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-20 bg-pk-bg-secondary rounded animate-pulse" />
            <div className="h-10 w-3/4 bg-pk-bg-secondary rounded animate-pulse" />
            <div className="h-20 w-full bg-pk-bg-secondary rounded animate-pulse opacity-50" />
            <div className="h-14 w-full bg-pk-bg-secondary rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-12 text-center text-pk-text-muted">
        <p className="mb-4">Product not found.</p>
        <button onClick={() => navigate('/')} className="text-pk-accent hover:underline">Return Home</button>
      </div>
    );
  }

  const selectedSizeObj = product.sizes?.find(s => s.name === selectedSize);
  
  const hasBasePrice = product.price > 0;
  const currentPrice = selectedSizeObj ? selectedSizeObj.price : (product.discountPrice || product.price || 0);
  const showSizeTag = selectedSizeObj && (!hasBasePrice || selectedSizeObj.price !== product.price);

  const hasOffer = product.offerPercent > 0 && !selectedSizeObj;
  const isOutOfStock = product.stockStatus === 'outOfStock';

  const inCartItem = cartItems.find(i => i.productId === product.id && i.size === (selectedSize || null));
  const inCart = !!inCartItem;

  const handleAction = () => {
    if (isOutOfStock) return;
    
    addToCart({
      productId: product.id,
      title: product.title,
      price: currentPrice,
      size: selectedSize || null,
      image: getOptimizedUrl(product.images?.[0]),
      quantity: 1
    });
    showSuccess(`${product.title} added to cart!`);
  };

  const handleUpdateQty = (newQty) => {
    if (newQty <= 0) {
      removeFromCart(product.id, selectedSize || null);
    } else {
      updateQuantity(product.id, selectedSize || null, newQty);
    }
  };

  const handleAdminEdit = () => {
    // Navigate to admin, passing the current product ID and return URL
    navigate('/admin/products', { 
      state: { 
        editProductId: product.id,
        returnUrl: location.pathname 
      } 
    });
  };

  const handleAdminDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${product.title}"?`)) {
      showSuccess('Deleting product...');
      try {
        await deleteProduct(product.id);
        showSuccess('Product deleted');
        navigate('/');
      } catch {
        showError('Failed to delete product');
      }
    }
  };

  const handleRelatedEdit = (p) => {
    navigate('/admin/products', { state: { editProductId: p.id, returnUrl: location.pathname } });
  };

  const handleRelatedDelete = async (productId) => {
    const backup = [...relatedProducts];
    setRelatedProducts(prev => prev.filter(p => p.id !== productId));
    showSuccess('Deleting...');
    try {
      await deleteProduct(productId);
      showSuccess('Deleted');
    } catch {
      showError('Failed');
      setRelatedProducts(backup);
    }
  };

  return (
    <div className="animate-[slideUp_0.4s_ease-out]">
      <SEO 
        title={product.title}
        description={`Buy ${product.title} at Popular Kitchen. ${product.description?.substring(0, 100) || 'Premium kitchenware'}`}
        image={getOptimizedUrl(product.images?.[0])}
        type="product"
      />

      {/* Structured Data (JSON-LD) for Google Rich Results */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": product.title,
          "image": product.images?.map(img => getOptimizedUrl(img)),
          "description": product.description,
          "brand": {
            "@type": "Brand",
            "name": "Popular Kitchen"
          },
          "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "INR",
            "price": currentPrice,
            "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
          }
        })}
      </script>

      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-pk-text-muted hover:text-pk-text-main mb-6 transition-colors">
        <FiArrowLeft /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-pk-surface p-6 md:p-8 rounded-3xl border border-pk-bg-secondary">
        
        {/* Images */}
        <div className="flex flex-col gap-4">
          <div 
            className="w-full aspect-square bg-pk-bg-primary rounded-2xl overflow-hidden relative cursor-pointer group select-none"
            onClick={handleImageClick}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEndHandler}
          >
            <ImageWithSkeleton 
              src={getOptimizedUrl(allImages[activeImage], 1200)} 
              alt={product.title} 
              containerClassName="w-full h-full pointer-events-none"
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 pointer-events-none"
            />
            {hasOffer && (
              <span className="absolute top-4 left-4 bg-pk-error text-white font-bold px-3 py-1 rounded-lg uppercase text-xs shadow-lg">
                {product.offerPercent}% OFF
              </span>
            )}
            
            {/* Desktop Navigation Indicators */}
            {allImages.length > 1 && (
              <>
                <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-start px-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
                  <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur text-white flex items-center justify-center pointer-events-none"><FiChevronLeft size={24}/></div>
                </div>
                <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-end px-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
                  <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur text-white flex items-center justify-center pointer-events-none"><FiChevronRight size={24}/></div>
                </div>
              </>
            )}
          </div>
          
          {allImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {allImages.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleImageChange(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${activeImage === idx ? 'border-pk-accent' : 'border-transparent'}`}
                >
                  <img src={getOptimizedUrl(img, 200)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <span className="text-pk-accent text-sm font-semibold tracking-wider uppercase">{product.category}</span>
            <ShareButton product={product} className="hover:scale-110" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-pk-text-main mb-4 leading-tight">{product.title}</h1>
          
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-pk-bg-secondary">
            {hasOffer ? (
              <div className="flex flex-col">
                <span className="text-pk-text-muted line-through text-lg">₹{product.price}</span>
                <span className="text-3xl font-bold text-pk-text-main">
                  ₹{currentPrice} {showSizeTag && <span className="text-base font-normal text-pk-text-muted">({selectedSizeObj.name})</span>}
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-pk-text-main">
                ₹{currentPrice} {showSizeTag && <span className="text-base font-normal text-pk-text-muted">({selectedSizeObj.name})</span>}
              </span>
            )}
            
            {isOutOfStock ? (
              <span className="ml-auto bg-pk-bg-secondary text-pk-text-muted px-3 py-1 rounded-full text-xs font-bold uppercase border border-pk-bg-secondary">Out of Stock</span>
            ) : product.stockStatus === 'limitedStock' ? (
              <span className="ml-auto bg-pk-warning/20 text-pk-warning px-3 py-1 rounded-full text-xs font-bold uppercase border border-pk-warning/50">Limited Stock</span>
            ) : (
              <span className="ml-auto bg-pk-success/20 text-pk-success px-3 py-1 rounded-full text-xs font-bold uppercase border border-pk-success/50">In Stock</span>
            )}
          </div>

          {isAdmin && (
            <div className="flex gap-3 mb-6 p-4 bg-pk-accent/5 rounded-2xl border border-pk-accent/20 animate-[slideDown_0.3s_ease-out]">
              <button 
                onClick={handleAdminEdit}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-pk-accent text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-lg shadow-pk-accent/10"
              >
                <FiEdit2 size={14} /> Edit Product
              </button>
              <button 
                onClick={handleAdminDelete}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-pk-error/10 text-pk-error rounded-xl text-sm font-bold hover:bg-pk-error hover:text-white transition-all"
              >
                <FiTrash2 size={14} /> Delete Product
              </button>
            </div>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6 pb-6 border-b border-pk-bg-secondary">
              <h3 className="text-sm font-medium text-pk-text-muted mb-3">Select Size</h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size, idx) => (
                  <button 
                    key={`${size.name}-${idx}`}
                    onClick={() => handleSizeSelect(size.name)}
                    className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center ${
                      selectedSize === size.name 
                      ? 'bg-pk-accent text-white shadow-[0_0_15px_rgba(30,144,255,0.4)] border-pk-accent' 
                      : 'bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary hover:border-pk-text-muted'
                    }`}
                  >
                    <span className="uppercase">{size.name}</span>
                    <span className={`text-[10px] opacity-80 ${selectedSize === size.name ? 'text-white' : 'text-pk-accent font-bold'}`}>₹{size.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mb-8 h-14">
            {!inCart ? (
              <button 
                onClick={handleAction}
                disabled={isOutOfStock || (product.sizes?.length > 0 && !selectedSize)}
                className="w-full bg-pk-accent text-white h-full rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-600 hover:shadow-[0_8px_25px_rgba(30,144,255,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-none"
              >
                <FiShoppingCart size={22} /> Add to Cart
              </button>
            ) : (
              <div className="flex items-center gap-3 w-full h-full">
                <div className="flex-1 h-full flex items-center bg-pk-bg-primary border border-pk-accent/30 rounded-2xl overflow-hidden shadow-inner p-1">
                  <button 
                    onClick={() => handleUpdateQty(inCartItem.quantity - 1)}
                    className="flex-1 h-full flex items-center justify-center text-pk-accent hover:bg-pk-accent/10 transition-colors rounded-xl"
                  >
                    <FiMinus size={24} />
                  </button>
                  <div className="w-20 text-center flex flex-col items-center">
                    <input
                      type="number"
                      value={inCartItem.quantity}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                        handleUpdateQty(val >= 0 ? val : 0);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-full bg-transparent border-none text-center text-xl font-black text-pk-text-main focus:ring-0 p-0 appearance-none"
                      style={{ MozAppearance: 'textfield' }}
                    />
                    <span className="text-[10px] font-bold text-pk-text-muted uppercase">In Cart</span>
                  </div>
                  <button 
                    onClick={() => handleUpdateQty(inCartItem.quantity + 1)}
                    className="flex-1 h-full flex items-center justify-center text-pk-accent hover:bg-pk-accent/10 transition-colors rounded-xl"
                  >
                    <FiPlus size={24} />
                  </button>
                </div>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-cart'))}
                  className="w-14 h-full flex items-center justify-center bg-pk-accent text-white rounded-2xl shadow-lg hover:shadow-pk-accent/40 active:scale-95 transition-all"
                  title="Go to Cart"
                >
                  <FiArrowRight size={26} />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-pk-text-muted mb-3">Description</h3>
            <p className="text-sm text-pk-text-main/90 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* More in this Category */}
      {relatedProducts.length > 0 && (
        <div className="mt-14 animate-[slideUp_0.5s_ease-out]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold text-pk-accent uppercase tracking-widest mb-1">More in {product.category}</p>
              <h2 className="text-xl md:text-2xl font-bold text-pk-text-main">You might also like</h2>
            </div>
            <Link
              to={`/search?category=${encodeURIComponent(product.category)}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-pk-accent hover:text-pk-text-main transition-colors"
            >
              View all <FiArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onEdit={isAdmin ? () => handleRelatedEdit(p) : undefined}
                onDelete={isAdmin ? () => handleRelatedDelete(p.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && allImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 z-50 transition-colors"
          >
            <FiX size={32} />
          </button>
          
          <div className="relative w-full max-w-5xl h-full max-h-[80vh] flex items-center justify-center px-4">
            {allImages.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleImageChange(activeImage === 0 ? allImages.length - 1 : activeImage - 1); }}
                className="absolute left-4 md:left-8 text-white/50 hover:text-white p-3 z-50 bg-black/20 hover:bg-black/40 rounded-full transition-all"
              >
                <FiChevronLeft size={40} />
              </button>
            )}
            
            <ImageWithSkeleton 
              src={getOptimizedUrl(allImages[activeImage], 2000)} 
              alt={product.title}
              containerClassName="max-w-full max-h-full"
              className="max-w-full max-h-full object-contain"
            />
            
            {allImages.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleImageChange(activeImage === allImages.length - 1 ? 0 : activeImage + 1); }}
                className="absolute right-4 md:right-8 text-white/50 hover:text-white p-3 z-50 bg-black/20 hover:bg-black/40 rounded-full transition-all"
              >
                <FiChevronRight size={40} />
              </button>
            )}
          </div>
          
          {allImages.length > 1 && (
            <div className="absolute bottom-6 flex gap-3 overflow-x-auto max-w-full px-4 scrollbar-hide">
              {allImages.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleImageChange(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-pk-accent scale-110 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={getOptimizedUrl(img, 200)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
