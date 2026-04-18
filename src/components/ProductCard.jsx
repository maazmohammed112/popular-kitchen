import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { getOptimizedUrl } from '../cloudinary/upload';

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
    <div className="group relative bg-pk-surface rounded-2xl overflow-hidden shadow-lg flex flex-col transition-transform hover:-translate-y-1">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none">
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

      <Link to={`/product/${product.id}`} className="flex flex-col flex-1">
        {/* Image */}
        <div className="w-full h-48 bg-[#1A2F50] overflow-hidden relative">
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
        <div className="p-4 flex flex-col flex-1 pb-2">
          <span className="text-xs text-pk-accent mb-1 uppercase tracking-wider">{product.category}</span>
          <h3 className="text-sm font-semibold text-pk-text-main line-clamp-1 mb-2">{product.title}</h3>
          
          {/* Price */}
          <div className="flex items-end justify-between mt-auto">
            <div className="flex flex-col">
              {hasOffer && !selectedSize ? (
                <>
                  <span className="text-xs text-pk-text-muted line-through">₹{product.price}</span>
                  <span className="text-lg font-bold text-pk-text-main leading-none">
                    ₹{currentPrice} {showSizeTag && <span className="text-[10px] font-normal text-pk-text-muted">({selectedSize.name})</span>}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-pk-text-main">
                  ₹{currentPrice} {showSizeTag && <span className="text-xs font-normal text-pk-text-muted">({selectedSize.name})</span>}
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
            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
              {normalizedSizes.map(size => (
                <button
                  key={size.name}
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setSelectedSize(size);
                    setLocalQty(0);
                  }}
                  className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border ${
                    selectedSize?.name === size.name 
                    ? 'border-pk-accent bg-pk-accent text-white' 
                    : 'border-pk-bg-secondary bg-pk-bg-primary text-pk-text-muted hover:border-pk-text-muted'
                  }`}
                >
                  {size.name}
                </button>
              ))}
            </div>
            {normalizedSizes.length > 0 && <span className="text-[9px] text-pk-text-muted italic block mt-1">Each size has its own price.</span>}
          </div>
        )}

        {/* Action Button / Qty */}
        <div className="flex flex-col gap-2">
           <div className="flex items-center bg-pk-bg-secondary rounded-xl overflow-hidden h-10">
              <span className="text-[10px] font-bold text-pk-text-muted px-3 uppercase">Qty</span>
              <input 
                type="number"
                value={localQty === 0 ? "" : localQty}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                  setLocalQty(val >= 0 ? val : 0);
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="flex-1 bg-transparent border-none text-sm font-bold text-pk-text-main focus:ring-0 px-2 h-full text-center appearance-none"
              />
           </div>

           <button 
             onClick={handleAddToCart}
             disabled={isOutOfStock || localQty <= 0}
             className="w-full h-10 rounded-xl bg-pk-accent flex items-center justify-center gap-2 text-white font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-pk-accent"
           >
             <FiShoppingCart size={14} /> Add to Cart
           </button>
           
           {inCart && (
             <p className="text-[10px] text-center text-pk-success font-medium">
               In Cart: {quantity} items
             </p>
           )}
        </div>
      </div>
    </div>
  );
};
