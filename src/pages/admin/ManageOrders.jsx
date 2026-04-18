import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiDownload, FiMessageCircle, FiSend } from 'react-icons/fi';
import { getOrders, updateOrderStatus } from '../../firebase/orders';
import { useToast } from '../../contexts/ToastContext';
import { generateAdminInvoice } from '../../utils/invoiceGenerator';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [shareModal, setShareModal] = useState(null); // { order, phone }
  
  const { showSuccess, showError } = useToast();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus, adminNote) => {
    try {
      await updateOrderStatus(id, newStatus, adminNote);
      showSuccess(`Order status updated to ${newStatus}`);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus, adminNote } : o));
    } catch (err) {
      console.error(err);
      showError("Failed to update status");
    }
  };

  const handleNoteSave = async (id, status, adminNote) => {
    try {
      await updateOrderStatus(id, status, adminNote);
      showSuccess("Admin note saved");
      setOrders(prev => prev.map(o => o.id === id ? { ...o, adminNote } : o));
    } catch (err) {
      console.error(err);
      showError("Failed to save note");
    }
  };

  const handleDownloadInvoice = async (order) => {
    try {
      await generateAdminInvoice(order);
    } catch (err) {
      console.error(err);
      showError("Failed to generate invoice.");
    }
  };

  const handleShareWhatsApp = (phone, order) => {
    const msg = encodeURIComponent(
      `Hello ${order.customerName}! Your order with Popular Kitchen (Order ID: ${order.id}) has been ${order.status}. Total: Rs. ${order.totalAmount}. Thank you for shopping with us! For queries call +91 88928 36046.`
    );
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  const isInvoiceReady = (status) => status === 'confirmed' || status === 'delivered';

  return (
    <div className="animate-[slideUp_0.4s_ease-out]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-pk-text-main">Manage Orders</h1>
      </div>

      {/* WhatsApp Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-pk-surface rounded-2xl p-6 w-full max-w-sm border border-pk-bg-secondary shadow-2xl">
            <h3 className="font-bold text-pk-text-main mb-1">Share Invoice via WhatsApp</h3>
            <p className="text-xs text-pk-text-muted mb-4">Order: {shareModal.order.id.slice(0,8)}</p>
            
            {/* Auto-fill customer number */}
            <button
              onClick={() => { handleShareWhatsApp(shareModal.order.phone, shareModal.order); setShareModal(null); }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#25D366] text-white rounded-xl mb-3 font-medium hover:bg-[#128C7E] transition-colors"
            >
              <FiMessageCircle size={18}/>
              Send to Customer ({shareModal.order.phone})
            </button>

            {/* Custom number */}
            <div className="flex gap-2 mb-4">
              <input
                id="custom-phone"
                type="tel"
                placeholder="Enter another number..."
                className="flex-1 bg-pk-bg-primary text-pk-text-main border border-pk-bg-secondary rounded-xl px-3 py-2 text-sm focus:border-pk-accent outline-none"
              />
              <button
                onClick={() => {
                  const ph = document.getElementById('custom-phone').value;
                  if (!ph) return;
                  handleShareWhatsApp(ph, shareModal.order);
                  setShareModal(null);
                }}
                className="px-4 py-2 bg-pk-accent text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"
              >
                <FiSend size={14}/> Send
              </button>
            </div>

            <button
              onClick={() => setShareModal(null)}
              className="w-full py-2 text-pk-text-muted hover:text-pk-text-main text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-pk-surface rounded-3xl border border-pk-bg-secondary overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-pk-text-muted animate-pulse">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-pk-text-muted">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-pk-bg-secondary bg-pk-bg-secondary/30">
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Order ID & Date</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Customer</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Amount</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Status</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Invoice</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <React.Fragment key={order.id}>
                    <tr className="border-b border-pk-bg-secondary/50 hover:bg-pk-bg-primary/50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-pk-accent text-xs mb-1 uppercase bg-pk-accent/10 w-max px-2 py-0.5 rounded">{order.id.slice(0,8)}</span>
                          <span className="text-pk-text-main text-sm">{order.createdAt ? new Date(order.createdAt.toMillis()).toLocaleDateString('en-IN') : 'Just now'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-pk-text-main">{order.customerName}</span>
                          <span className="text-xs text-pk-text-muted">{order.phone}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-pk-text-main">₹{order.totalAmount}</span>
                      </td>
                      <td className="p-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value, order.adminNote || '')}
                          className={`text-xs font-bold uppercase rounded-md px-3 py-1.5 focus:outline-none cursor-pointer border border-transparent hover:border-gray-500 transition-colors ${
                            order.status === 'delivered' ? 'bg-pk-success/20 text-pk-success' :
                            order.status === 'confirmed' ? 'bg-pk-warning/20 text-pk-warning' :
                            'bg-pk-bg-primary text-pk-text-main border-pk-bg-secondary'
                          }`}
                        >
                          <option value="pending" className="bg-pk-bg-primary text-pk-text-main">Pending</option>
                          <option value="confirmed" className="bg-pk-bg-primary text-pk-text-main">Confirmed</option>
                          <option value="delivered" className="bg-pk-bg-primary text-pk-text-main">Delivered</option>
                        </select>
                      </td>
                      {/* Invoice column – only shows when confirmed/delivered */}
                      <td className="p-4">
                        {isInvoiceReady(order.status) ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadInvoice(order)}
                              title="Download Invoice"
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-pk-accent/10 text-pk-accent hover:bg-pk-accent hover:text-white rounded-lg transition-colors font-medium"
                            >
                              <FiDownload size={14}/> PDF
                            </button>
                            <button
                              onClick={() => setShareModal({ order })}
                              title="Share via WhatsApp"
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-lg transition-colors font-medium"
                            >
                              <FiMessageCircle size={14}/> Share
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-pk-text-muted italic">Set Confirmed</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}
                          className="p-2 text-pk-text-muted hover:text-pk-text-main bg-pk-bg-secondary rounded-full transition-colors"
                        >
                          {expandedRow === order.id ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {expandedRow === order.id && (
                      <tr className="bg-pk-bg-primary border-b border-pk-bg-secondary">
                        <td colSpan="6" className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 text-sm">
                              <div>
                                <span className="block text-pk-text-muted font-medium mb-1">Delivery Address</span>
                                <p className="text-pk-text-main bg-pk-surface p-3 rounded-lg border border-pk-bg-secondary">{order.address}</p>
                              </div>
                              <div className="bg-pk-surface p-4 rounded-xl border border-pk-bg-secondary">
                                <span className="block text-pk-text-muted font-medium mb-3">Order Items</span>
                                <div className="space-y-3">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-pk-text-main pb-2 border-b border-pk-bg-secondary/50 last:border-0 last:pb-0">
                                      <div className="flex flex-col">
                                        <span className="font-medium line-clamp-1">{item.title}</span>
                                        <span className="text-xs text-pk-text-muted">Size: {item.size} | Qty: {item.quantity}</span>
                                      </div>
                                      <span className="font-semibold">₹{item.price * item.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="block text-pk-text-muted font-medium mb-2 text-sm">Admin Notes (Internal)</span>
                              <textarea
                                defaultValue={order.adminNote}
                                id={`note-${order.id}`}
                                placeholder="Add notes about delivery updates, issues, etc."
                                className="w-full bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl px-4 py-3 min-h-[120px] focus:outline-none focus:border-pk-accent text-sm resize-none mb-3"
                              />
                              <button
                                onClick={() => {
                                  const note = document.getElementById(`note-${order.id}`).value;
                                  handleNoteSave(order.id, order.status, note);
                                }}
                                className="px-6 py-2 bg-pk-bg-secondary hover:bg-pk-accent text-pk-text-main hover:text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                Save Note
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
