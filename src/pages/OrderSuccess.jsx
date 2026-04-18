import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiDownload, FiChevronLeft, FiCopy, FiMessageCircle } from 'react-icons/fi';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { generateInvoice } from '../utils/invoiceGenerator';
import { useToast } from '../contexts/ToastContext';

export default function OrderSuccess() {
  const { id } = useParams();
  const { showError } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docRef = doc(db, 'orders', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleDownload = () => {
    if (!order) return;
    try {
      generateInvoice(order);
    } catch (err) {
      console.error(err);
      showError("Failed to generate invoice.");
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    showSuccess("Order ID copied to clipboard!");
  };

  if (loading) return <div className="text-center py-20 animate-pulse">Loading order details...</div>;
  if (!order) return <div className="text-center py-20">Order not found.</div>;

  return (
    <div className="max-w-2xl mx-auto text-center py-12 animate-[slideUp_0.5s_ease-out]">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-pk-success/10 text-pk-success rounded-full mb-6">
        <FiCheckCircle size={48} />
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
      <p className="text-pk-text-muted mb-6">
        Thank you, <span className="text-white font-medium">{order.customerName}</span>. Your order has been received.
      </p>

      <div className="flex items-center justify-center gap-3 mb-8 bg-pk-surface p-3 rounded-xl border border-pk-bg-secondary w-max mx-auto shadow-inner">
        <span className="text-sm text-pk-text-muted">Order ID:</span>
        <span className="font-mono text-pk-accent font-bold tracking-wider">{order.id}</span>
        <button onClick={handleCopyId} className="text-pk-text-muted hover:text-white transition-colors p-2 bg-pk-bg-primary rounded-lg ml-2" title="Copy Order ID">
          <FiCopy />
        </button>
      </div>

      <div className="bg-pk-surface p-6 rounded-3xl border border-pk-bg-secondary mb-8 text-left">
        <h2 className="text-lg font-bold mb-4 border-b border-pk-bg-secondary pb-4">Order Summary</h2>
        <div className="flex justify-between items-center mb-2">
          <span className="text-pk-text-muted">Status</span>
          <span className="bg-pk-warning/20 text-pk-warning px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{order.status}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-pk-text-muted">Total Amount</span>
          <span className="text-xl font-bold text-white">₹{order.totalAmount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-pk-text-muted">Items</span>
          <span className="text-white">{order.items.length} items</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
        <button 
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-pk-bg-secondary text-white rounded-full font-medium hover:bg-pk-surface border border-pk-bg-secondary hover:border-pk-accent transition-colors text-sm"
        >
          <FiDownload /> Download Invoice
        </button>
        
        <a 
          href={`https://wa.me/9108167067?text=${encodeURIComponent(`this is my order id ${order.id} i have place order can give further updates and payment related details etc`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-medium hover:bg-[#128C7E] transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)] text-sm"
        >
          <FiMessageCircle /> WhatsApp for Payment & Updates
        </a>

        <Link 
          to="/"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-pk-accent text-white rounded-full font-medium hover:bg-blue-600 shadow-[0_0_15px_rgba(30,144,255,0.3)] transition-all text-sm w-full sm:w-auto"
        >
          <FiChevronLeft /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}
