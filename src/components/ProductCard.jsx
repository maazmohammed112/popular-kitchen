import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiCheck } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { getOptimizedUrl } from '../cloudinary/upload';
import { ShareButton } from './ShareButton';
import { ImageWithSkeleton } from './ImageWithSkeleton';

export const ProductCard = ({ product }) => {
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const { showSuccess } = useToast();

  const normalizedSizes = (product.sizes || []).map(s => 
    typeof s === 'string' ? { name: s, price: product.discountPrice || product.price } : s
  );

  const [selectedSize, setSelectedSize] = useState(normalizedSizes.length > 0 ? normalizedSizes[0] : null);
  const [localQty, setLocalQty] = useState(0);

  const hasBasePrice = product.price > 0;
  const currentPrice = selectedSize ? selectedSize.price : (product.discountPrice || product.price || 0);
  const showSizeTag = selectedSize && (!hasBasePrice || selectedSize.price !== product.price);
  
  const inCartItem = cartItems.find(i => i.productId === product.id && i.size === (selectedSize ? selectedSize.name : null));
  const inCart = !!inCartItem;
  const quantity = inCartItem ? inCartItem.quantity : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product.stockStatus === 'outOfStock') return;

    addToCart({
      productId: product.id,
      title: product.title,
      price: currentPrice,
      size: selectedSize ? selectedSize.name : null, 
      image: getOptimizedUrl(product.images?.[0]),
      quantity: Number(localQty)
    });
    setLocalQty(0);
    showSuccess(`${product.title} added to cart`);
  };

  const handleUpdateQty = (e, newQty) => {
    e.preventDefault();
    if (newQty <= 0) {
      removeFromCart(product.id, selectedSize ? selectedSize.name : null);
    } else {
      updateQuantity(product.id, selectedSize ? selectedSize.name : null, newQty);
    }
  };

  const hasOffer = product.offerPercent > 0 && !selectedSize; 
  const isOutOfStock = product.stockStatus === 'outOfStock';
  const imgUrl = getOptimizedUrl(product.images?.[0]);

  return (
    <div className="group relative bg-pk-surface rounded-2xl overflow-hidden border border-pk-bg-secondary shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
      
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {hasOffer && (
          <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide"
            style={{ background: 'var(--color-tertiary)' }}>
            {product.offerPercent}% OFF
          </span>
        )}
        {product.stockStatus === 'limitedStock' && (
          <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide"
            style={{ background: 'var(--color-secondary)' }}>
            Few Left
          </span>
        )}
      </div>

      {/* Share Button */}
      <div className="absolute top-3 right-3 z-20">
        <ShareButton product={product} />
      </div>

      <Link to={`/product/${product.id}`} className="flex flex-col flex-1">
        {/* Image */}
        <div className="w-full h-48 overflow-hidden relative bg-pk-bg-primary">
          <ImageWithSkeleton 
            src={imgUrl} 
            alt={product.title} 
            containerClassName="w-full h-full"
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
          />
          
          {isOutOfStock && (
            <div className="absolute inset-x-0 top-20 flex justify-center z-10">
              <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-lg font-bold tracking-wider text-xs"
                style={{ color: 'var(--color-primary)' }}>
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 pb-2">
          <span className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--color-secondary)' }}>
            {product.category}
          </span>
          <h3 className="text-sm font-bold text-pk-text-main line-clamp-2 mb-3 leading-snug">{product.title}</h3>
          
          {/* Price */}
          <div className="flex items-end justify-between mt-auto">
            <div className="flex flex-col">
              {hasOffer && !selectedSize ? (
                <>
                  <span className="text-xs text-pk-text-muted line-through">₹{product.price}</span>
                  <span className="text-xl font-bold leading-none" style={{ color: 'var(--color-primary)' }}>
                    ₹{currentPrice}
                    {showSizeTag && <span className="text-[10px] font-normal text-pk-text-muted ml-1">({selectedSize.name})</span>}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  ₹{currentPrice}
                  {showSizeTag && <span className="text-xs font-normal text-pk-text-muted ml-1">({selectedSize.name})</span>}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 bg-pk-surface relative z-20">
        {/* Size Selection */}
        {normalizedSizes.length > 0 && (
          <div className="mb-3">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 flex-wrap">
              {normalizedSizes.map(size => (
                <button
                  key={size.name}
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setSelectedSize(size);
                    setLocalQty(0);
                  }}
                  className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg whitespace-nowrap transition-all border text-xs`}
                  style={selectedSize?.name === size.name
                    ? { background: 'var(--color-secondary)', color: 'white', borderColor: 'var(--color-secondary)' }
                    : { background: 'transparent', color: 'var(--color-secondary)', borderColor: 'var(--color-secondary)' + '40' }}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center gap-2">
          <div className="w-[38%] flex items-center bg-pk-bg-primary border border-pk-bg-secondary rounded-xl overflow-hidden h-10 focus-within:border-pk-secondary transition-colors">
            <input 
              type="number"
              value={localQty === 0 ? "" : localQty}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                setLocalQty(val >= 0 ? val : 0);
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Qty"
              className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 px-2 h-full text-center appearance-none placeholder:text-pk-text-muted/50"
              style={{ color: 'var(--color-primary)' }}
            />
          </div>

          <button 
            onClick={handleAddToCart}
            disabled={isOutOfStock || localQty <= 0}
            className="w-[62%] h-10 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
            style={{ background: inCart ? 'var(--color-tertiary)' : 'var(--color-primary)' }}
          >
            {inCart ? <FiCheck size={14} /> : <FiShoppingCart size={14} />}
            {inCart ? 'In Cart' : 'Add to Cart'}
          </button>
        </div>
        
        {inCart && (
          <p className="text-[10px] text-center font-semibold mt-2" style={{ color: 'var(--color-tertiary)' }}>
            ✓ {quantity} item{quantity > 1 ? 's' : ''} in cart
          </p>
        )}
      </div>
    </div>
  );
};
