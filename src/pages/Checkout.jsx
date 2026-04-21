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
import { ConfirmOrderModal } from '../components/ConfirmOrderModal';
import { sendEmail, getOrderEmailTemplate } from '../utils/emailService';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    const fetchUserDetails = async () => {
      // Priority 1: Logged in user with saved details in Firestore
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        
        // Check for pending checkout details in localStorage first (highest priority if just logged in)
        const pending = localStorage.getItem('pk_pending_checkout');
        if (pending) {
          try {
            const parsed = JSON.parse(pending);
            setFormData(parsed);
            
            // Auto-save these to Firestore for the user
            await setDoc(userRef, { shippingDetails: parsed }, { merge: true });
            localStorage.removeItem('pk_pending_checkout'); // Done
            return;
          } catch (e) {}
        }

        if (docSnap.exists() && docSnap.data().shippingDetails) {
          setFormData(docSnap.data().shippingDetails);
        } else {
          setFormData(prev => ({ ...prev, name: currentUser.displayName || '' }));
        }
      } else {
        // Guest view - check for temporary local storage (not pending login)
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
    
    // FORCED AUTH: Guests must sign in/up to place order
    if (!isAuthenticated) {
      // Save their progress
      localStorage.setItem('pk_pending_checkout', JSON.stringify(formData));
      showError("Please sign in or sign up to complete your order.");
      window.dispatchEvent(new CustomEvent('show-auth-modal', { detail: 'signin' }));
      return;
    }

    if (!formData.name || !formData.phone || !formData.address) {
      showError("Please fill out all fields.");
      return;
    }

    // Step 2: Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const orderData = {
        customerName: formData.name,
        phone: formData.phone,
        email: formData.email || '',
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
      
      // Send automatic email confirmation
      if (formData.email) {
        sendEmail({
          to: formData.email,
          subject: `Order Received: #${orderId.slice(0, 8).toUpperCase()} - Popular Kitchen`,
          htmlContent: getOrderEmailTemplate({ ...orderData, id: orderId })
        });
      }

      // Save details for next time
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { shippingDetails: formData }, { merge: true });

      setShowConfirmModal(false);
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
      {showAuth && <AuthModal defaultTab="signup" onClose={() => setShowAuth(false)} />}
      {showConfirmModal && (
        <ConfirmOrderModal 
          onConfirm={handleFinalSubmit} 
          onCancel={() => setShowConfirmModal(false)}
          isSubmitting={isSubmitting}
        />
      )}
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
                  placeholder="+91 88928 36046"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pk-text-muted mb-2 flex justify-between items-center">
                  Email Address 
                  <span className="text-[10px] uppercase tracking-wider text-pk-accent font-bold bg-pk-accent/10 px-2 py-0.5 rounded-md">Optional - Recommended</span>
                </label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 focus:outline-none focus:border-pk-accent focus:ring-1 focus:ring-pk-accent transition-colors"
                  placeholder="name@example.com"
                />
                <p className="text-[10px] text-pk-text-muted mt-1 ml-1 italic">For order tracking and official receipts</p>
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
