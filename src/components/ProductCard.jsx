import { Link } from 'react-router-dom';
import { FiShoppingCart, FiCheckCircle } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { getOptimizedUrl } from '../cloudinary/upload';

export const ProductCard = ({ product }) => {
  const { addToCart, cartItems } = useCart();
  const { showSuccess, showError } = useToast();

  const inCart = cartItems.some(i => i.productId === product.id);

  const handleAction = (e) => {
    e.preventDefault();
    if (inCart) {
      window.dispatchEvent(new CustomEvent('open-cart'));
      return;
    }

    if (product.sizes && product.sizes.length > 0) {
      showError('Please select a size from the product details.');
      return;
    }

    addToCart({
      productId: product.id,
      title: product.title,
      price: product.discountPrice || product.price,
      size: null, 
      image: getOptimizedUrl(product.images?.[0]),
      quantity: 1
    });
    showSuccess(`${product.title} added to cart`);
  };

  const hasOffer = product.offerPercent > 0;
  const isOutOfStock = product.stockStatus === 'outOfStock';
  const imgUrl = getOptimizedUrl(product.images?.[0]);

  return (
    <Link to={`/product/${product.id}`} className="group relative bg-pk-surface rounded-2xl overflow-hidden shadow-lg flex flex-col h-[320px] transition-transform hover:-translate-y-1">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {hasOffer && (
          <span className="bg-pk-error text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase">
            {product.offerPercent}% OFF
          </span>
        )}
        {product.stockStatus === 'limitedStock' && (
          <span className="bg-pk-warning text-pk-bg-primary text-[10px] font-bold px-2 py-1 rounded-md uppercase">
            Few Left
          </span>
        )}
      </div>

      {/* Image */}
      <div className="w-full h-48 bg-[#1A2F50] overflow-hidden">
        {imgUrl ? (
          <img 
            src={imgUrl} 
            alt={product.title} 
            loading="lazy" 
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`} 
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-pk-text-muted">No Image</div>
        )}
        
        {isOutOfStock && (
          <div className="absolute inset-x-0 top-20 flex justify-center z-10">
            <span className="bg-pk-bg-primary/90 backdrop-blur-md px-4 py-2 rounded-lg text-pk-text-main font-bold tracking-wider text-xs">
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs text-pk-accent mb-1 uppercase tracking-wider">{product.category}</span>
        <h3 className="text-sm font-semibold text-pk-text-main line-clamp-1">{product.title}</h3>
        
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex flex-col">
            {hasOffer ? (
              <>
                <span className="text-xs text-pk-text-muted line-through">₹{product.price}</span>
                <span className="text-lg font-bold text-pk-text-main leading-none">₹{product.discountPrice}</span>
              </>
            ) : (
              <span className="text-lg font-bold text-pk-text-main">₹{product.price}</span>
            )}
          </div>
          
          <button 
            onClick={handleAction}
            disabled={isOutOfStock}
            className="w-10 h-10 rounded-full bg-pk-bg-secondary flex items-center justify-center text-pk-text-main hover:bg-pk-accent transition-colors disabled:opacity-50 disabled:hover:bg-pk-bg-secondary"
            aria-label={inCart ? "Go to cart" : "Add to cart"}
          >
            {inCart ? <FiCheckCircle className="w-4 h-4 text-pk-success" /> : <FiShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Link>
  );
};
