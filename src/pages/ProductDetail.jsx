import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';
import { getProduct } from '../firebase/products';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { getOptimizedUrl } from '../cloudinary/upload';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { showSuccess } = useToast();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProduct(id);
        if (data) {
          setProduct(data);
          if (data.sizes && data.sizes.length > 0) {
            setSelectedSize(data.sizes[0]);
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

  const hasOffer = product.offerPercent > 0;
  const isOutOfStock = product.stockStatus === 'outOfStock';

  const inCart = cartItems.some(i => i.productId === product.id && i.size === (selectedSize || null));

  const handleAction = () => {
    if (inCart) {
      window.dispatchEvent(new CustomEvent('open-cart'));
      return;
    }
    if (isOutOfStock) return;
    
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.discountPrice || product.price,
      size: selectedSize || null,
      image: getOptimizedUrl(product.images?.[0]),
      quantity
    });
    showSuccess(`${product.title} added to cart!`);
  };

  return (
    <div className="animate-[slideUp_0.4s_ease-out]">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-pk-text-muted hover:text-pk-text-main mb-6 transition-colors">
        <FiArrowLeft /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-pk-surface p-6 md:p-8 rounded-3xl border border-pk-bg-secondary">
        
        {/* Images */}
        <div className="flex flex-col gap-4">
          <div className="w-full aspect-square bg-[#1A2F50] rounded-2xl overflow-hidden relative">
            {product.images?.[activeImage] ? (
              <img 
                src={getOptimizedUrl(product.images[activeImage], 1200)} 
                alt={product.title} 
                className="w-full h-full object-cover" 
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
          <span className="text-pk-accent text-sm font-semibold tracking-wider uppercase mb-2">{product.category}</span>
          <h1 className="text-2xl md:text-3xl font-bold text-pk-text-main mb-4 leading-tight">{product.title}</h1>
          
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-pk-bg-secondary">
            {hasOffer ? (
              <div className="flex flex-col">
                <span className="text-pk-text-muted line-through text-lg">₹{product.price}</span>
                <span className="text-3xl font-bold text-pk-text-main">₹{product.discountPrice}</span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-pk-text-main">₹{product.price}</span>
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
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedSize === size 
                      ? 'bg-pk-accent text-white shadow-[0_0_15px_rgba(30,144,255,0.4)] border-pk-accent' 
                      : 'bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary hover:border-pk-text-muted'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center bg-pk-bg-primary border border-pk-bg-secondary rounded-xl p-1">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center text-pk-text-muted hover:text-pk-text-main rounded-lg transition-colors"
              >
                <FiMinus />
              </button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center text-pk-text-muted hover:text-pk-text-main rounded-lg transition-colors"
              >
                <FiPlus />
              </button>
            </div>
            
            <button 
              onClick={handleAction}
              disabled={(!inCart && isOutOfStock) || (!inCart && product.sizes?.length > 0 && !selectedSize)}
              className="flex-1 bg-pk-accent text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-pk-accent"
            >
              <FiShoppingCart /> {inCart ? 'Go to Cart' : 'Add to Cart'}
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
    </div>
  );
}
