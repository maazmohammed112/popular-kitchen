import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiCheck, FiMoreVertical, FiEdit2, FiTrash2, FiPlus, FiMinus, FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { getOptimizedUrl } from '../cloudinary/upload';
import { ShareButton } from './ShareButton';
import { ImageWithSkeleton } from './ImageWithSkeleton';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const ProductCard = ({ product, onEdit, onDelete }) => {
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const { showSuccess } = useToast();
  const { isAdmin } = useAuth();

  const normalizedSizes = (product.sizes || []).map(s =>
    typeof s === 'string' ? { name: s, price: product.discountPrice || product.price } : s
  );

  const sizeImages = normalizedSizes.map(s => s.image).filter(Boolean);
  const allImages = [...new Set([...(product.images || []), ...sizeImages])];
  const [activeImage, setActiveImage] = useState(0);

  const [selectedSize, setSelectedSize] = useState(normalizedSizes.length > 0 ? normalizedSizes[0] : null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef(null);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const handleImageChange = (e, newIdx) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveImage(newIdx);
    const currentImg = allImages[newIdx];
    const sizeObj = normalizedSizes.find(s => s.image === currentImg);
    if (sizeObj) setSelectedSize(sizeObj);
  };

  const handleSizeSelect = (e, sizeObj) => {
    e.preventDefault();
    setSelectedSize(sizeObj);
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

  const onTouchEndHandler = (e) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && activeImage < allImages.length - 1) {
      handleImageChange(e, activeImage + 1);
    }
    if (isRightSwipe && activeImage > 0) {
      handleImageChange(e, activeImage - 1);
    }
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

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
      quantity: 1
    });
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

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(product.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const hasOffer = product.offerPercent > 0 && !selectedSize;
  const isOutOfStock = product.stockStatus === 'outOfStock';
  const imgUrl = allImages.length > 0 ? getOptimizedUrl(allImages[activeImage]) : null;

  return (
    <>
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

        {/* Top-right: Share + Admin Menu */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {/* Admin three-dot menu */}
          {isAdmin && (onEdit || onDelete) && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.preventDefault(); setMenuOpen(prev => !prev); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-pk-bg-primary/80 backdrop-blur text-pk-text-muted hover:text-pk-text-main hover:bg-pk-bg-secondary transition-all shadow"
                title="Product actions"
              >
                <FiMoreVertical size={16} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 bg-pk-surface border border-pk-bg-secondary rounded-xl shadow-2xl min-w-[130px] py-1 animate-[slideDown_0.15s_ease-out] z-30">
                  {onEdit && (
                    <button
                      onClick={(e) => { e.preventDefault(); setMenuOpen(false); onEdit(product); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-pk-text-main hover:bg-pk-bg-secondary transition-colors"
                    >
                      <FiEdit2 size={14} className="text-pk-accent" /> Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.preventDefault(); setMenuOpen(false); setShowDeleteConfirm(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-pk-error hover:bg-pk-error/10 transition-colors"
                    >
                      <FiTrash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <ShareButton product={product} />
        </div>

        <Link to={`/product/${product.id}`} className="flex flex-col flex-1">
          {/* Image */}
          <div 
            className="w-full h-48 overflow-hidden relative bg-pk-bg-primary select-none group/img"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEndHandler}
          >
            {imgUrl ? (
              <ImageWithSkeleton
                src={imgUrl}
                alt={product.title}
                containerClassName="w-full h-full bg-white pointer-events-none"
                className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 pointer-events-none ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
              />
            ) : (
              <div className="w-full h-full bg-pk-bg-secondary flex flex-col items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-pk-text-muted opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] text-pk-text-muted font-medium uppercase tracking-wide">No Image</span>
              </div>
            )}

            {isOutOfStock && (
              <div className="absolute inset-x-0 top-20 flex justify-center z-10 pointer-events-none">
                <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-lg font-bold tracking-wider text-xs"
                  style={{ color: 'var(--color-primary)' }}>
                  OUT OF STOCK
                </span>
              </div>
            )}
            
            {/* Desktop Navigation Overlays */}
            {allImages.length > 1 && (
              <>
                <div 
                  className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer hidden md:flex items-center justify-start px-2 opacity-0 group-hover/img:opacity-100 transition-opacity"
                  onClick={(e) => handleImageChange(e, activeImage > 0 ? activeImage - 1 : allImages.length - 1)}
                  title="Previous image"
                >
                  <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur text-white flex items-center justify-center pointer-events-none shadow-sm"><FiChevronLeft size={20}/></div>
                </div>
                <div 
                  className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer hidden md:flex items-center justify-end px-2 opacity-0 group-hover/img:opacity-100 transition-opacity"
                  onClick={(e) => handleImageChange(e, activeImage < allImages.length - 1 ? activeImage + 1 : 0)}
                  title="Next image"
                >
                  <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur text-white flex items-center justify-center pointer-events-none shadow-sm"><FiChevronRight size={20}/></div>
                </div>
                
                {/* Dots indicator */}
                <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                  {allImages.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${activeImage === i ? 'w-4 bg-pk-accent' : 'w-1.5 bg-pk-bg-secondary/80'}`} />
                  ))}
                </div>
              </>
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
                {normalizedSizes.map((size, idx) => (
                  <button
                    key={`${size.name}-${idx}`}
                    onClick={(e) => handleSizeSelect(e, size)}
                    className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg whitespace-nowrap transition-all border text-xs"
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
          <div className="flex items-center gap-2 h-10">
            {!inCart ? (
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full h-full rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'var(--color-primary)' }}
              >
                <FiShoppingCart size={14} /> Add to Cart
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full h-full">
                <div className="flex-1 h-full flex items-center bg-pk-bg-primary border border-pk-secondary/30 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={(e) => handleUpdateQty(e, quantity - 1)}
                    className="flex-1 h-full flex items-center justify-center text-pk-secondary hover:bg-pk-secondary/10 transition-colors"
                  >
                    <FiMinus size={14} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                      handleUpdateQty(e, val >= 0 ? val : 0);
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-8 bg-transparent border-none text-center font-black text-sm text-pk-text-main focus:ring-0 p-0 appearance-none"
                    style={{ MozAppearance: 'textfield' }}
                  />
                  <button
                    onClick={(e) => handleUpdateQty(e, quantity + 1)}
                    className="flex-1 h-full flex items-center justify-center text-pk-secondary hover:bg-pk-secondary/10 transition-colors"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-cart')); }}
                  className="w-10 h-full flex items-center justify-center bg-pk-secondary text-white rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all"
                  title="Go to Cart"
                >
                  <FiArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmDeleteModal
          message="This product will be permanently deleted. Are you sure?"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};
