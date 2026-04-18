import { FiX, FiShoppingCart, FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { CartSkeleton } from './Skeletons';

export const CartDrawer = ({ isOpen, onClose }) => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, isLoaded } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-pk-bg-primary/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[400px] bg-pk-surface shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pk-bg-secondary">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FiShoppingCart size={20} className="text-pk-accent" />
            Your Cart
          </h2>
          <button onClick={onClose} className="p-2 text-pk-text-muted hover:text-white bg-pk-bg-secondary rounded-full">
             <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!isLoaded ? (
            Array(3).fill(0).map((_, i) => <CartSkeleton key={i} />)
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-pk-text-muted">
              <div className="w-20 h-20 bg-pk-bg-secondary rounded-full flex items-center justify-center mb-4">
                 <FiShoppingCart size={32} className="text-pk-text-muted opacity-50" />
              </div>
              <p className="font-semibold text-pk-text-main mb-1">Your cart is empty</p>
              <p className="text-sm">Looks like you haven't added anything yet.</p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-pk-accent text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {cartItems.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex gap-4 p-4 border-b border-pk-bg-secondary/50">
                  <div className="w-20 h-20 bg-pk-bg-secondary rounded-xl overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px]">No Img</div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-pk-text-main line-clamp-2 pr-2">{item.title}</h3>
                      <button 
                        onClick={() => removeFromCart(item.productId, item.size)}
                        className="text-pk-text-muted hover:text-pk-error flex-shrink-0"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    
                    {item.size && (
                      <span className="text-xs text-pk-text-muted mt-1">Size: <span className="uppercase text-pk-text-main font-medium">{item.size}</span></span>
                    )}
                    
                    <div className="mt-auto flex justify-between items-center pt-2">
                       <span className="font-bold text-sm">₹{item.price * item.quantity}</span>
                       <div className="flex items-center gap-3 bg-pk-bg-secondary rounded-full px-2 py-1">
                          <button 
                            disabled={item.quantity <= 1}
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                            className="text-pk-text-muted hover:text-white disabled:opacity-30"
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                            className="text-pk-text-muted hover:text-white"
                          >
                            <FiPlus size={14} />
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-pk-bg-secondary bg-pk-surface">
            <div className="flex justify-between items-center mb-4 text-pk-text-main">
              <span className="font-medium text-pk-text-muted">Subtotal</span>
              <span className="font-bold text-lg">₹{cartTotal}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full py-3 bg-pk-success text-pk-bg-primary font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,150,0.3)] hover:scale-[1.02] transition-transform active:scale-95"
            >
              Checkout Now
            </button>
          </div>
        )}
      </div>
    </>
  );
};
