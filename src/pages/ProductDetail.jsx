import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMinus, FiPlus, FiShoppingCart, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getProduct } from '../firebase/products';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { SEO } from '../components/SEO';
import { getOptimizedUrl } from '../cloudinary/upload';
import { ShareButton } from '../components/ShareButton';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { showSuccess } = useToast();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
    return <div className="p-12 text-center text-pk-text-muted animate-pulse">Loading product...</div>;
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
    if (inCart) {
      window.dispatchEvent(new CustomEvent('open-cart'));
      return;
    }
    if (isOutOfStock) return;
    
    addToCart({
      productId: product.id,
      title: product.title,
      price: currentPrice,
      size: selectedSize || null,
      image: getOptimizedUrl(product.images?.[0]),
      quantity: Number(quantity)
    });
    setQuantity(0);
    showSuccess(`${product.title} added to cart!`);
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
            className="w-full aspect-square bg-[#1A2F50] rounded-2xl overflow-hidden relative cursor-pointer group"
            onClick={() => product.images?.length > 0 && setIsLightboxOpen(true)}
          >
            {product.images?.[activeImage] ? (
              <img 
                src={getOptimizedUrl(product.images[activeImage], 1200)} 
                alt={product.title} 
                className="w-full h-full object-contain md:object-cover transition-transform duration-500 group-hover:scale-105" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-pk-text-muted">No Image</div>
            )}
            {hasOffer && (
              <span className="absolute top-4 left-4 bg-pk-error text-white font-bold px-3 py-1 rounded-lg uppercase text-xs shadow-lg">
                {product.offerPercent}% OFF
              </span>
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {product.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(idx)}
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

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6 pb-6 border-b border-pk-bg-secondary">
              <h3 className="text-sm font-medium text-pk-text-muted mb-3">Select Size</h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map(size => (
                  <button 
                    key={size.name}
                    onClick={() => {
                      setSelectedSize(size.name);
                      setQuantity(0);
                    }}
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
          <div className="flex items-center gap-4 mb-8">
            <div className="w-[40%] flex items-center bg-pk-bg-primary border border-pk-bg-secondary rounded-2xl overflow-hidden h-14 focus-within:border-pk-accent transition-all shadow-inner">
               <input 
                 type="number"
                 value={quantity === 0 ? "" : quantity}
                 onChange={(e) => {
                   const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                   setQuantity(val >= 0 ? val : 0);
                 }}
                 onFocus={(e) => e.target.select()}
                 placeholder="Qty"
                 className="flex-1 bg-transparent border-none text-base md:text-lg font-bold text-pk-text-main focus:ring-0 px-2 md:px-4 h-full text-center appearance-none placeholder:text-pk-text-muted/30"
               />
            </div>
            
            <button 
              onClick={handleAction}
              disabled={(!inCart && isOutOfStock) || (!inCart && product.sizes?.length > 0 && !selectedSize) || (!inCart && quantity <= 0)}
              className="w-[60%] bg-pk-accent text-white h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-600 hover:shadow-[0_8px_25px_rgba(30,144,255,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-none"
            >
              <FiShoppingCart size={22} /> {inCart ? 'Go to Cart' : 'Add to Cart'}
            </button>
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

      {/* Lightbox Modal */}
      {isLightboxOpen && product.images?.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 z-50 transition-colors"
          >
            <FiX size={32} />
          </button>
          
          <div className="relative w-full max-w-5xl h-full max-h-[80vh] flex items-center justify-center px-4">
            {product.images.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => prev === 0 ? product.images.length - 1 : prev - 1); }}
                className="absolute left-4 md:left-8 text-white/50 hover:text-white p-3 z-50 bg-black/20 hover:bg-black/40 rounded-full transition-all"
              >
                <FiChevronLeft size={40} />
              </button>
            )}
            
            <img 
              src={getOptimizedUrl(product.images[activeImage], 2000)} 
              alt={product.title}
              className="max-w-full max-h-full object-contain"
            />
            
            {product.images.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => prev === product.images.length - 1 ? 0 : prev + 1); }}
                className="absolute right-4 md:right-8 text-white/50 hover:text-white p-3 z-50 bg-black/20 hover:bg-black/40 rounded-full transition-all"
              >
                <FiChevronRight size={40} />
              </button>
            )}
          </div>
          
          {product.images.length > 1 && (
            <div className="absolute bottom-6 flex gap-3 overflow-x-auto max-w-full px-4 scrollbar-hide">
              {product.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
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
