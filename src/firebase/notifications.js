/**
 * Utility to send Telegram notifications for Admin tracking.
 * Uses a free Telegram Bot to alert the owner immediately of new orders or cancellations.
 */

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

import { sendEmail, getOrderEmailTemplate } from '../utils/emailService';

/**
 * Escape HTML characters for Telegram's HTML parse_mode
 */
const escapeHTML = (str) => {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Send a push notification to a specific user via Netlify function
 */
export const sendPushToUser = async (userId, title, body, data = {}) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./config');
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return;

    const fcmToken = userDoc.data()?.fcmToken;
    if (!fcmToken) return;

    const response = await fetch('/.netlify/functions/push-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: fcmToken,
        title,
        body,
        data
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
};

export const sendTelegramMessage = async (message, buttons = null) => {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("Telegram credentials missing in .env");
    return;
  }

  // Split comma-separated IDs and send to all in parallel
  const rawIds = CHAT_ID?.toString() || '';
  const ids = rawIds.split(',').map(id => id.trim()).filter(Boolean);

  if (ids.length === 0) {
    console.warn("No valid Telegram Chat IDs found");
    return;
  }

  const sendToOne = async (id) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const body = {
      chat_id: id,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };
    if (buttons) {
      body.reply_markup = JSON.stringify({ inline_keyboard: buttons });
    }
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (!response.ok) console.error(`Telegram error for ${id}:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to notify ${id}:`, error);
    }
  };

  // Fire all sends simultaneously — one notification event, reaches all admins at once
  return Promise.all(ids.map(sendToOne));
};

/**
 * Generate deep links for customer contact
 */
/**
 * Generate deep links for customer contact and invoice
 */
const getContactButtons = (orderId, orderData, statusLabel, includeInvoice = false) => {
  const name = orderData.customerName || 'Customer';
  const phone = orderData.phone?.replace(/\D/g, '') || '';
  const email = orderData.email || '';
  const origin = window.location.origin;
  
  const text = encodeURIComponent(`Hello ${name}, your order #${orderId} has been ${statusLabel}. Thank you for shopping with Popular Kitchen!`);
  const subject = encodeURIComponent(`Order Update - Popular Kitchen #${orderId}`);

  const buttons = [];
  
  // WhatsApp
  if (phone) {
    const cleanPhone = phone.startsWith('91') ? phone : '91' + phone;
    buttons.push([{ 
      text: "📱 WhatsApp Customer", 
      url: `https://wa.me/${cleanPhone}?text=${text}` 
    }]);
  }

  // Invoice Download Button
  if (includeInvoice) {
    buttons.push([{ 
      text: "📄 Download Invoice (Latest)", 
      url: `${origin}/admin/invoice/${orderId}`
    }]);
  }

  // Email
  if (email && email.includes('@')) {
    buttons.push([{ 
      text: "✉️ Send Email", 
      url: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${text}` 
    }]);
  }

  return buttons;
};

/**
 * Format a 'New Order' notification
 */
export const notifyNewOrder = async (orderId, orderData) => {
  const itemsList = orderData.items
    ?.map(item => `• ${escapeHTML(item.quantity)}x ${escapeHTML(item.title)} (${escapeHTML(item.size)})`)
    .join('\n') || 'No items listed';

  const message = `
<b>🛍️ NEW ORDER RECEIVED!</b>

<b>Order ID:</b> <code>#${escapeHTML(orderId)}</code>
<b>Customer:</b> ${escapeHTML(orderData.customerName)}
<b>Phone:</b> ${escapeHTML(orderData.phone)}
<b>Total:</b> ₹${orderData.totalAmount?.toLocaleString('en-IN') || '0'}

<b>Items:</b>
${itemsList}

<b>Address:</b>
<i>${escapeHTML(orderData.address)}</i>

🔗 <a href="${window.location.origin}/admin/invoice/${orderId}">Direct Invoice Link</a>
  `;

  // Always include invoice button in new order too for convenience
  const buttons = getContactButtons(orderId, orderData, 'received', true);
  
  // Send Email to Customer
  if (orderData.email) {
    const emailHtml = getOrderEmailTemplate({ id: orderId, status: 'pending', ...orderData });
    sendEmail({ to: orderData.email, subject: `Order Received: #${orderId.slice(0, 8).toUpperCase()} - Popular Kitchen`, htmlContent: emailHtml });
  }

  return sendTelegramMessage(message, buttons.length > 0 ? buttons : null);
};

/**
 * Format a 'Status Update' notification
 */
export const notifyStatusUpdate = async (orderId, orderData, oldStatus, newStatus, adminNote) => {
  const message = `
<b>🔄 ORDER UPDATE</b>

<b>Order ID:</b> <code>#${escapeHTML(orderId)}</code>
<b>Customer:</b> ${escapeHTML(orderData.customerName)}

<b>Status:</b> ${escapeHTML(oldStatus)} ➔ <b>${escapeHTML(newStatus.toUpperCase())}</b>
${adminNote ? `<b>Note:</b> ${escapeHTML(adminNote)}` : ''}

🔗 <a href="${window.location.origin}/admin/invoice/${orderId}">Direct Invoice Link</a>
  `;

  // Send Push Notification to Customer
  const userId = orderData.userId || orderData.customer?.id;
  if (userId) {
    let pushTitle = 'Order Update';
    let pushBody = `Your order status has been updated.`;

    if (newStatus === 'confirmed') {
      pushTitle = 'Order Confirmed! ✅';
      pushBody = `Your order #${orderId.slice(0, 8)} has been confirmed and is being prepared.`;
    } else if (newStatus === 'delivered') {
      pushTitle = 'Order Delivered! 🚚';
      pushBody = `Your order #${orderId.slice(0, 8)} has been delivered. Enjoy!`;
    } else {
      pushBody = `Your order status is now: ${newStatus.toUpperCase()}`;
    }

    sendPushToUser(userId, pushTitle, pushBody, { orderId });
  }

  // Include invoice button for confirmed or delivered orders
  const showInvoice = newStatus === 'confirmed' || newStatus === 'delivered';
  const buttons = getContactButtons(orderId, orderData, newStatus, showInvoice);

  // Send Email to Customer for status updates
  if (orderData.email) {
    const emailHtml = getOrderEmailTemplate({ id: orderId, status: newStatus, adminNote, ...orderData });
    const subjectPrefix = newStatus === 'confirmed' ? 'Order Confirmed' : 
                          newStatus === 'delivered' ? 'Order Delivered' : 
                          'Order Update';
    sendEmail({ 
      to: orderData.email, 
      subject: `${subjectPrefix}: #${orderId.slice(0, 8).toUpperCase()} - Popular Kitchen`, 
      htmlContent: emailHtml 
    });
  }

  return sendTelegramMessage(message, buttons.length > 0 ? buttons : null);
};

/**
 * Format a 'Cancellation' notification
 */
export const notifyOrderCancelled = async (orderId, orderData, cancelledBy) => {
  const message = `
<b>❌ ORDER CANCELLED</b>

<b>Order ID:</b> <code>#${escapeHTML(orderId)}</code>
<b>Customer:</b> ${escapeHTML(orderData.customerName)}
<b>Phone:</b> ${escapeHTML(orderData.phone)}
<b>Email:</b> ${escapeHTML(orderData.email || 'Not Provided')}

<b>Cancelled By:</b> ${escapeHTML(cancelledBy === 'admin' ? 'Admin' : 'Customer')}

<a href="${window.location.origin}/admin/orders">Manage Orders</a>
  `;

  // Send Push Notification to Customer
  const userId = orderData.userId || orderData.customer?.id;
  if (userId) {
    const actor = cancelledBy === 'admin' ? 'the store' : 'you';
    sendPushToUser(
      userId, 
      'Order Cancelled ❌', 
      `Your order #${orderId.slice(0, 8)} was cancelled by ${actor}.`,
      { orderId, status: 'cancelled' }
    );
  }

  // Send Email to Customer
  if (orderData.email) {
    const emailHtml = getOrderEmailTemplate({ id: orderId, status: 'cancelled', cancelledBy, ...orderData });
    sendEmail({ to: orderData.email, subject: `Order Cancelled: #${orderId.slice(0, 8).toUpperCase()} - Popular Kitchen`, htmlContent: emailHtml });
  }

  const buttons = getContactButtons(orderId, orderData, 'cancelled');
  return sendTelegramMessage(message, buttons.length > 0 ? buttons : null);
};

/**
 * Format an 'Empty Search' notification
 */
export const notifyEmptySearch = async (query, userData) => {
  const customerInfo = userData?.email 
    ? `${escapeHTML(userData.displayName || 'User')} (${escapeHTML(userData.email)})`
    : 'Guest Customer';

  const message = `
<b>🔍 MISSING PRODUCT SEARCH</b>

<b>Query:</b> <code>${escapeHTML(query)}</code>
<b>User:</b> ${customerInfo}
<b>Time:</b> ${new Date().toLocaleString('en-IN')}

<i>A customer searched for this but found no results. Consider adding this product to your store.</i>

<a href="${window.location.origin}/search?q=${encodeURIComponent(query)}">View Search Results</a>
  `;

  return sendTelegramMessage(message);
};

/**
 * Format a 'Guest Search' notification
 */
export const notifyGuestSearch = async (query) => {
  const message = `
<b>🔍 GUEST VISITOR SEARCH</b>

<b>Query:</b> <code>${escapeHTML(query)}</code>
<b>User:</b> Guest / Non-Logged In
<b>Time:</b> ${new Date().toLocaleString('en-IN')}

<i>A guest visitor is browsing for this item.</i>

<a href="${window.location.origin}/search?q=${encodeURIComponent(query)}">View Product Results</a>
  `;

  return sendTelegramMessage(message);
};
