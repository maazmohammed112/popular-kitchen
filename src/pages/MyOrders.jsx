import { useState, useEffect, useCallback } from 'react';
import { FiPackage, FiAlertTriangle, FiX, FiCopy, FiMessageCircle, FiRefreshCw, FiDownload } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { listenToUserOrders, cancelOrder } from '../firebase/orders';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { generateCustomerInvoice } from '../utils/invoiceGenerator';
import { sendEmail, getOrderEmailTemplate } from '../utils/emailService';

const STATUS_STYLES = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const OrderItem = ({ item }) => (
  <div className="flex justify-between text-sm text-pk-text-muted py-1 border-b border-pk-bg-secondary/30 last:border-0">
    <span className="flex-1 pr-4">
      {item.title}
      {item.size && item.size !== 'N/A' ? ` (${item.size})` : ''} × {item.quantity}
    </span>
    <span className="font-medium">₹{Number(item.price || 0) * Number(item.quantity || 1)}</span>
  </div>
);

const OrderItemsList = ({ items = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const showMore = items.length > 10;
  const displayItems = isExpanded ? items : items.slice(0, 10);

  return (
    <div className="space-y-1 mb-4">
      {displayItems.map((item, i) => <OrderItem key={i} item={item} />)}
      {showMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-pk-accent mt-2 hover:underline flex items-center gap-1"
        >
          {isExpanded ? (
            <><FiX size={12} /> Show Less</>
          ) : (
            `+ ${items.length - 10} more items`
          )}
        </button>
      )}
    </div>
  );
};

export default function MyOrders() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const isGuest = !currentUser;

  useEffect(() => {
    let unsubscribe;
    if (!isGuest) {
      setLoading(true);
      unsubscribe = listenToUserOrders(currentUser.uid, (data) => {
        setOrders(data);
        setLoading(false);
      });
    } else {
      const fetchGuestOrders = async () => {
        setLoading(true);
        try {
          const stored = JSON.parse(localStorage.getItem('pk_guest_orders') || '[]');
          if (stored.length === 0) {
            setOrders([]);
            return;
          }
          const refreshed = await Promise.all(
            stored.map(async (o) => {
              if (!o.id) return o;
              try {
                const snap = await getDoc(doc(db, 'orders', o.id));
                if (snap.exists()) return { ...o, ...snap.data(), id: o.id };
              } catch { /* network issue  return cached */ }
              return o;
            })
          );
          setOrders([...refreshed].reverse());
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchGuestOrders();
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [currentUser, isGuest]);



  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelOrder(cancelTarget);
      
      // Send cancellation email
      const order = orders.find(o => o.id === cancelTarget);
      if (order && order.email) {
        sendEmail({
          to: order.email,
          subject: `Order Cancelled: #${order.id.slice(0, 8).toUpperCase()} - Popular Kitchen`,
          htmlContent: getOrderEmailTemplate({ ...order, status: 'cancelled', cancelledBy: 'user' })
        });
      }

      setOrders(prev => prev.map(o => o.id === cancelTarget ? { ...o, status: 'cancelled' } : o));
      if (isGuest) {
        const stored = JSON.parse(localStorage.getItem('pk_guest_orders') || '[]');
        localStorage.setItem('pk_guest_orders', JSON.stringify(
          stored.map(o => o.id === cancelTarget ? { ...o, status: 'cancelled' } : o)
        ));
      }
      showSuccess('Order cancelled successfully.');
    } catch (err) {
      console.error(err);
      showError('Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-pk-text-main">My Orders</h1>
      </div>
      <p className="text-pk-text-muted text-sm mb-8">
        {isGuest
          ? 'Browsing as Guest — orders saved on this device.'
          : `Signed in as ${currentUser.displayName || currentUser.email}`}
      </p>

      {/* Cancel Confirmation Dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-pk-surface border border-pk-bg-secondary rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-pk-error">
              <FiAlertTriangle size={26} />
              <h3 className="font-bold text-pk-text-main text-lg">Cancel Order?</h3>
            </div>
            <p className="text-sm text-pk-text-muted mb-6">
              This action cannot be undone. The admin will also be notified.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-pk-bg-secondary text-pk-text-muted hover:text-pk-text-main font-medium text-sm"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-pk-error text-white font-bold text-sm hover:bg-red-600 disabled:opacity-60"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-pk-surface border border-pk-bg-secondary rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-pk-bg-secondary rounded-lg animate-pulse" />
                  <div className="h-3 w-32 bg-pk-bg-secondary rounded-lg animate-pulse opacity-50" />
                </div>
                <div className="h-8 w-20 bg-pk-bg-secondary rounded-lg animate-pulse" />
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-4 w-full bg-pk-bg-secondary rounded-lg animate-pulse opacity-30" />
                <div className="h-4 w-2/3 bg-pk-bg-secondary rounded-lg animate-pulse opacity-30" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-24 bg-pk-bg-secondary rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-pk-bg-secondary rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && fetchError && (
        <div className="text-center py-16 bg-pk-surface border border-pk-error/30 rounded-3xl px-6">
          <FiAlertTriangle size={40} className="mx-auto text-pk-error mb-4 opacity-70" />
          <p className="font-semibold text-pk-text-main mb-1">Could not load orders</p>
          <p className="text-xs text-pk-text-muted mb-5 max-w-xs mx-auto">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-pk-accent text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && orders.length === 0 && (
        <div className="text-center py-20 bg-pk-surface border border-pk-bg-secondary rounded-3xl">
          <FiPackage size={48} className="mx-auto text-pk-text-muted mb-4 opacity-40" />
          <p className="font-semibold text-pk-text-main mb-1">No orders yet</p>
          <p className="text-xs text-pk-text-muted">Place your first order and it will appear here.</p>
        </div>
      )}

      {/* Orders list */}
      {!loading && !fetchError && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-pk-surface border border-pk-bg-secondary rounded-2xl p-5 shadow-sm hover:border-pk-accent/30 transition-colors"
            >
              {/* Order header */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-pk-accent bg-pk-accent/10 px-2 py-0.5 rounded">
                      {order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                      {order.status || 'pending'}
                    </span>
                  </div>
                  <p className="text-xs text-pk-text-muted">
                    {order.createdAt?.toMillis
                      ? new Date(order.createdAt.toMillis()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Recent order'}
                  </p>
                </div>
                <span className="text-xl font-bold text-pk-text-main">
                  ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Items */}
              <OrderItemsList items={order.items} />

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-3 border-t border-pk-bg-secondary">
                {order.status === 'cancelled' && order.cancelledBy === 'admin' && (
                  <div className="bg-red-50 text-red-600 text-xs p-2 rounded-lg mb-1 border border-red-100 flex items-center justify-between">
                    <span>Cancelled by Popular Kitchen team. Contact us on WhatsApp for details.</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(order.id); showSuccess('Order ID copied!'); }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-pk-bg-primary text-pk-text-muted hover:text-pk-text-main border border-pk-bg-secondary rounded-lg transition-colors"
                  >
                    <FiCopy size={12} /> Copy ID
                  </button>

                  {order.status !== 'cancelled' ? (
                    <button
                      onClick={async () => {
                        try {
                          await generateCustomerInvoice(order);
                        } catch (err) {
                          console.error(err);
                          showError('Failed to download invoice.');
                        }
                      }}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                    >
                      <FiDownload size={12} /> Invoice
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-lg"
                    >
                      <FiDownload size={12} /> Invoice (Disabled)
                    </button>
                  )}

                  <a
                    href={order.status === 'cancelled' ? 
                      `https://wa.me/919108167067?text=${encodeURIComponent(`Hello Popular Kitchen, my order (Order ID: #${order.id}) was cancelled. Can you tell me the reason?`)}` :
                      `https://wa.me/919108167067?text=${encodeURIComponent(`Hello Popular Kitchen! I'm checking on my order (ID: #${order.id}). Status: ${order.status || 'pending'}. Total: ₹${order.totalAmount}.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-lg hover:bg-[#25D366] hover:text-white transition-colors"
                  >
                    <FiMessageCircle size={12} /> WhatsApp
                  </a>

                  {order.status === 'pending' && (
                    <button
                      onClick={() => setCancelTarget(order.id)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-pk-error/10 text-pk-error border border-pk-error/20 rounded-lg hover:bg-pk-error hover:text-white transition-colors ml-auto"
                    >
                      <FiX size={12} /> Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
