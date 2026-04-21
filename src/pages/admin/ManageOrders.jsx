import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiDownload, FiMessageCircle, FiSend, FiMail, FiMessageSquare } from 'react-icons/fi';
import { SiWhatsapp, SiGmail } from 'react-icons/si';
import { getOrders, listenToOrders, updateOrderStatus, cancelOrder } from '../../firebase/orders';
import { useToast } from '../../contexts/ToastContext';
import { generateAdminInvoice } from '../../utils/invoiceGenerator';

import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ManageOrders() {
  const { canManageOrders } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [shareModal, setShareModal] = useState(null); // { order, phone }
  const [searchTerm, setSearchTerm] = useState('');
  
  const { showSuccess, showError } = useToast();

  if (!canManageOrders) return <Navigate to="/admin/dashboard" replace />;

  useEffect(() => {
    setLoading(true);
    // Subscribe to real-time order updates
    const unsubscribe = listenToOrders((data) => {
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const handleStatusChange = async (id, newStatus, adminNote) => {
    if (newStatus === 'cancelled') {
      if (window.confirm("Are you sure you want to cancel this order? This cannot be undone.")) {
        try {
          await cancelOrder(id, 'admin');
          showSuccess("Order cancelled successfully");
        } catch (err) {
          console.error(err);
          showError("Failed to cancel order");
        }
      }
      return;
    }
    try {
      await updateOrderStatus(id, newStatus, adminNote);
      showSuccess(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      showError("Failed to update status");
    }
  };

  const handleNoteSave = async (id, status, adminNote) => {
    try {
      await updateOrderStatus(id, status, adminNote);
      showSuccess("Admin note saved");
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

  const isInvoiceReady = (status) => status === 'confirmed' || status === 'delivered';

  const getPredefinedMessage = (order) => {
    const { id, status, cancelledBy } = order;
    const shortId = id.slice(0, 8).toUpperCase();
    
    if (status === 'pending') {
      return `We have received your order ${shortId}, please allow some hours for further update thank you. - Popular Kitchen Team`;
    }
    if (status === 'confirmed') {
      return `Your order ${shortId} has been confirmed! We are preparing it now. - Popular Kitchen Team`;
    }
    if (status === 'delivered') {
      return `Your order ${shortId} has been delivered. Enjoy your meal! - Popular Kitchen Team`;
    }
    if (status === 'cancelled') {
      if (cancelledBy === 'user') {
        return `Your order ${shortId} has been cancelled as per your request. - Popular Kitchen Team`;
      }
      return `We regret to inform you that your order ${shortId} has been cancelled. Please contact us for more details. - Popular Kitchen Team`;
    }
    return `Update for your order ${shortId}: Status is now ${status}. - Popular Kitchen Team`;
  };

  const handleSendWhatsApp = (order) => {
    const msg = encodeURIComponent(getPredefinedMessage(order));
    const phone = order.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleSendEmail = (order) => {
    if (!order.email) {
      showError("Customer email not found");
      return;
    }
    const subject = encodeURIComponent(`Order Update: ${order.status.toUpperCase()} - ${order.id.slice(0,8).toUpperCase()} - Popular Kitchen`);
    const body = encodeURIComponent(getPredefinedMessage(order));
    const adminEmail = 'mohammed@popularkitchen.store';
    window.location.href = `mailto:${order.email}?cc=${adminEmail}&subject=${subject}&body=${body}`;
  };

  const handleSendSMS = (order) => {
    const msg = encodeURIComponent(getPredefinedMessage(order));
    const phone = order.phone.replace(/\D/g, '');
    window.location.href = `sms:${phone}?body=${msg}`;
  };

  const filteredOrders = orders.filter(o => 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.phone?.includes(searchTerm) ||
    o.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-[slideUp_0.4s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-pk-text-main">Manage Orders</h1>
        <div className="w-full md:w-auto relative">
          <input
            type="text"
            placeholder="Search by name, phone, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 bg-pk-surface text-pk-text-main border border-pk-bg-secondary rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-pk-accent"
          />
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-pk-surface rounded-2xl p-6 w-full max-w-sm border border-pk-bg-secondary shadow-2xl">
            <h3 className="font-bold text-pk-text-main mb-1">Share Invoice via WhatsApp</h3>
            <p className="text-xs text-pk-text-muted mb-4">Order: {shareModal.order.id.slice(0,8)}</p>
            
            {/* Auto-fill customer number */}
            <button
              onClick={() => { handleSendWhatsApp(shareModal.order); setShareModal(null); }}
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
                  const msg = encodeURIComponent(`Hello! Your order with Popular Kitchen is currently ${shareModal.order.status}. Thank you!`);
                  window.open(`https://wa.me/${ph.replace(/\D/g, '')}?text=${msg}`, '_blank');
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
                  <th className="p-4 font-medium text-pk-text-muted text-sm">Notify</th>
                  <th className="p-4 font-medium text-pk-text-muted text-sm text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <React.Fragment key={order.id}>
                    <tr className={`border-b border-pk-bg-secondary/50 hover:bg-pk-bg-primary/50 transition-colors ${order.status === 'cancelled' ? 'opacity-70' : ''}`}>
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
                          disabled={order.status === 'cancelled'}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value, order.adminNote || '')}
                          className={`text-xs font-bold uppercase rounded-md px-3 py-1.5 focus:outline-none cursor-pointer border border-transparent hover:border-gray-500 transition-colors disabled:opacity-80 disabled:cursor-not-allowed ${
                            order.status === 'delivered' ? 'bg-pk-success/20 text-pk-success' :
                            order.status === 'confirmed' ? 'bg-pk-warning/20 text-pk-warning' :
                            order.status === 'cancelled' ? 'bg-pk-error/20 text-pk-error' :
                            'bg-pk-bg-primary text-pk-text-main border-pk-bg-secondary'
                          }`}
                        >
                          <option value="pending" className="bg-pk-bg-primary text-pk-text-main">Pending</option>
                          <option value="confirmed" className="bg-pk-bg-primary text-pk-text-main">Confirmed</option>
                          <option value="delivered" className="bg-pk-bg-primary text-pk-text-main">Delivered</option>
                          <option value="cancelled" className="bg-pk-bg-primary text-pk-error font-bold">Cancel Order</option>
                        </select>
                      </td>
                      {/* Notification column */}
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSendWhatsApp(order)}
                            title="Send WhatsApp"
                            className="p-2 text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors"
                          >
                            <SiWhatsapp size={16}/>
                          </button>
                          <button
                            onClick={() => handleSendEmail(order)}
                            title="Send Email"
                            className="p-2 text-[#EA4335] hover:bg-[#EA4335]/10 rounded-lg transition-colors"
                          >
                            <SiGmail size={16}/>
                          </button>
                          <button
                            onClick={() => handleSendSMS(order)}
                            title="Send SMS"
                            className="p-2 text-pk-accent hover:bg-pk-accent/10 rounded-lg transition-colors"
                          >
                            <FiMessageSquare size={16}/>
                          </button>
                          {isInvoiceReady(order.status) && (
                            <button
                              onClick={() => handleDownloadInvoice(order)}
                              title="Download Invoice"
                              className="p-2 text-pk-text-muted hover:text-pk-text-main hover:bg-pk-bg-secondary rounded-lg transition-colors"
                            >
                              <FiDownload size={16}/>
                            </button>
                          )}
                        </div>
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
                        <td colSpan="7" className="p-6">
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
