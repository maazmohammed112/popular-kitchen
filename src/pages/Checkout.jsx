import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createOrder } from '../firebase/orders';
import { SignUpPromptModal } from '../components/SignUpPromptModal';
import { AuthModal } from '../components/AuthModal';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestConfirmed, setGuestConfirmed] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const isGuest = !currentUser || currentUser.uid === 'mock-admin';

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (currentUser && currentUser.uid !== 'mock-admin') {
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists() && docSnap.data().shippingDetails) {
          setFormData(docSnap.data().shippingDetails);
        } else {
          setFormData(prev => ({ ...prev, name: currentUser.displayName || '' }));
        }
      } else {
        const saved = localStorage.getItem('pk_guest_shipping');
        if (saved) {
          try { setFormData(JSON.parse(saved)); } catch (e) {}
        }
      }
    };
    fetchUserDetails();
  }, [currentUser]);

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20 animate-[slideUp_0.4s_ease-out]">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-pk-accent rounded-full font-medium">Continue Shopping</button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Show sign up prompt for guests first time (only once)
    if (isGuest && !guestConfirmed) {
      setShowGuestPrompt(true);
      return;
    }
    if (!formData.name || !formData.phone || !formData.address) {
      showError("Please fill out all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        customerName: formData.name,
        phone: formData.phone,
        address: formData.address,
        items: cartItems.map(item => ({
          productId: item.productId,
          title: item.title,
          size: item.size || 'N/A',
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: cartTotal,
        status: "pending",
        adminNote: "",
        userId: currentUser ? currentUser.uid : "guest"
      };

      const orderId = await createOrder(orderData);
      
      // Save details for next time
      if (currentUser && currentUser.uid !== 'mock-admin') {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { shippingDetails: formData }, { merge: true });
      } else {
        localStorage.setItem('pk_guest_shipping', JSON.stringify(formData));
      }

      // Save full order to localStorage for guest history
      const guestOrders = JSON.parse(localStorage.getItem('pk_guest_orders') || '[]');
      guestOrders.push({ id: orderId, ...orderData, createdAt: null });
      localStorage.setItem('pk_guest_orders', JSON.stringify(guestOrders));

      clearCart();
      showSuccess("Order placed successfully!");
      navigate(`/order-success/${orderId}`);
    } catch (error) {
      console.error(error);
      showError("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-[slideUp_0.4s_ease-out] max-w-4xl mx-auto">
      {/* Guest Sign Up Prompt */}
      {showGuestPrompt && (
        <SignUpPromptModal
          onContinueAsGuest={() => {
            setShowGuestPrompt(false);
            setGuestConfirmed(true);
            // Submit after state updates in next tick
            setTimeout(() => document.getElementById('checkout-form')?.requestSubmit(), 50);
          }}
          onSignUp={() => {
            setShowGuestPrompt(false);
            setShowAuth(true);
          }}
        />
      )}
      {showAuth && <AuthModal defaultTab="signup" onClose={() => setShowAuth(false)} />}
      <h1 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
        <FiLock className="text-pk-accent" /> Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form */}
        <div className="lg:col-span-2">
          <form id="checkout-form" onSubmit={handleSubmit} className="bg-pk-surface p-6 md:p-8 rounded-3xl border border-pk-bg-secondary space-y-6">
            <h2 className="text-lg font-bold border-b border-pk-bg-secondary pb-4">Shipping Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pk-text-muted mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:outline-none focus:border-pk-accent focus:ring-1 focus:ring-pk-accent transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-pk-text-muted mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:outline-none focus:border-pk-accent focus:ring-1 focus:ring-pk-accent transition-colors"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pk-text-muted mb-2">Delivery Address</label>
                <textarea 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:outline-none focus:border-pk-accent focus:ring-1 focus:ring-pk-accent transition-colors min-h-[120px] resize-y"
                  placeholder="123 Main St, Appt 4B..."
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-pk-success text-pk-bg-primary font-bold shadow-[0_0_15px_rgba(0,200,150,0.2)] hover:shadow-[0_0_25px_rgba(0,200,150,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Processing...' : <><FiCheckCircle size={20} /> Place Order - ₹{cartTotal}</>}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-pk-surface p-6 rounded-3xl border border-pk-bg-secondary sticky top-24">
            <h2 className="text-lg font-bold border-b border-pk-bg-secondary pb-4 mb-4">Order Summary</h2>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4 pr-2">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-16 h-16 bg-[#1A2F50] rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-xs font-semibold line-clamp-1">{item.title}</h3>
                    <div className="text-[10px] text-pk-text-muted mt-1 flex justify-between">
                      <span>Size: {item.size || 'N/A'} | Qty: {item.quantity}</span>
                      <span className="font-semibold text-pk-text-main">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-pk-bg-secondary pt-4 flex justify-between items-end">
              <span className="text-pk-text-muted">Total Amount</span>
              <span className="text-2xl font-bold text-pk-text-main leading-none">₹{cartTotal}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
