import { useState, useEffect } from 'react';
import { FiPackage, FiAlertTriangle, FiX, FiCopy, FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { getUserOrders, cancelOrder } from '../firebase/orders';
import { useToast } from '../contexts/ToastContext';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-pk-warning/20 dark:text-pk-warning',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-pk-accent/20 dark:text-pk-accent',
  delivered: 'bg-green-100 text-green-700 dark:bg-pk-success/20 dark:text-pk-success',
  cancelled: 'bg-red-100 text-red-700 dark:bg-pk-error/20 dark:text-pk-error',
};

export default function MyOrders() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null); // order id to confirm cancel
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { fetchOrders(); }, [currentUser]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (currentUser && currentUser.uid !== 'mock-admin') {
        // Signed-in user — fetch from Firestore
        const data = await getUserOrders(currentUser.uid);
        setOrders(data);
      } else {
        // Guest — read from localStorage
        const stored = JSON.parse(localStorage.getItem('pk_guest_orders') || '[]');
        // Refresh statuses from Firestore in case admin updated them
        const refreshed = await Promise.all(stored.map(async (o) => {
          try {
            const snap = await getDoc(doc(db, 'orders', o.id));
            return snap.exists() ? { ...o, ...snap.data(), id: o.id } : o;
          } catch { return o; }
        }));
        setOrders(refreshed.reverse());
      }
    } catch (err) {
      console.error(err);
      showError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelOrder(cancelTarget);
      setOrders(prev => prev.map(o => o.id === cancelTarget ? { ...o, status: 'cancelled' } : o));
      // Also update localStorage for guests
      if (!currentUser || currentUser.uid === 'mock-admin') {
        const stored = JSON.parse(localStorage.getItem('pk_guest_orders') || '[]');
        const updated = stored.map(o => o.id === cancelTarget ? { ...o, status: 'cancelled' } : o);
        localStorage.setItem('pk_guest_orders', JSON.stringify(updated));
      }
      showSuccess('Order cancelled successfully.');
    } catch (err) {
      console.error(err);
      showError('Failed to cancel order.');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl md:text-3xl font-bold text-pk-text-main mb-2">My Orders</h1>
      <p className="text-pk-text-muted text-sm mb-8">
        {currentUser && currentUser.uid !== 'mock-admin'
          ? `Signed in as ${currentUser.email}`
          : 'You are browsing as Guest — orders saved locally.'}
      </p>

      {/* Confirm cancel dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-pk-surface border border-pk-bg-secondary rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-pk-warning">
              <FiAlertTriangle size={28} />
              <h3 className="font-bold text-pk-text-main text-lg">Cancel Order?</h3>
            </div>
            <p className="text-sm text-pk-text-muted mb-6">
              This action cannot be undone. The order will be marked as <strong>Cancelled</strong> and the admin will be notified.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-pk-bg-secondary text-pk-text-muted hover:text-pk-text-main font-medium text-sm transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-pk-error text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-pk-surface border border-pk-bg-secondary rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-pk-surface border border-pk-bg-secondary rounded-3xl">
          <FiPackage size={48} className="mx-auto text-pk-text-muted mb-4 opacity-50" />
          <p className="text-pk-text-muted">No orders found yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-pk-surface border border-pk-bg-secondary rounded-2xl p-5 shadow-sm hover:border-pk-accent/30 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-pk-accent bg-pk-accent/10 px-2 py-0.5 rounded">{order.id.slice(0,8).toUpperCase()}</span>
                    <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                      {order.status || 'pending'}
                    </span>
                  </div>
                  <p className="text-xs text-pk-text-muted">
                    {order.createdAt?.toMillis
                      ? new Date(order.createdAt.toMillis()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Recent'}
                  </p>
                </div>
                <span className="text-xl font-bold text-pk-text-main">₹{order.totalAmount}</span>
              </div>

              {/* Items */}
              <div className="space-y-1 mb-4">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-pk-text-muted">
                    <span>{item.title} {item.size && item.size !== 'N/A' ? `(${item.size})` : ''} × {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-pk-bg-secondary">
                <button
                  onClick={() => { navigator.clipboard.writeText(order.id); showSuccess('Order ID copied!'); }}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-pk-bg-primary text-pk-text-muted hover:text-pk-text-main border border-pk-bg-secondary rounded-lg transition-colors"
                >
                  <FiCopy size={12} /> Copy ID
                </button>

                <a
                  href={`https://wa.me/919108167067?text=${encodeURIComponent(`Hello Popular Kitchen! Checking on my order (ID: ${order.id}). Status: ${order.status || 'pending'}. Total: Rs. ${order.totalAmount}.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-lg hover:bg-[#25D366] hover:text-white transition-colors"
                >
                  <FiMessageCircle size={12} /> WhatsApp
                </a>

                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button
                    onClick={() => setCancelTarget(order.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-pk-error/10 text-pk-error border border-pk-error/20 rounded-lg hover:bg-pk-error hover:text-white transition-colors ml-auto"
                  >
                    <FiX size={12} /> Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
