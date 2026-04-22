/**
 * Utility to send Telegram notifications for Admin tracking.
 * Uses a free Telegram Bot to alert the owner immediately of new orders or cancellations.
 */

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

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

export const sendTelegramMessage = async (message, buttons = null) => {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("Telegram credentials missing in .env");
    return;
  }

  // Split comma-separated IDs and send to all in parallel (one event, one notification per admin)
  const ids = CHAT_ID.toString().split(',').map(id => id.trim()).filter(Boolean);

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
const getContactButtons = (orderId, orderData, statusLabel) => {
  const name = orderData.customerName || 'Customer';
  const phone = orderData.phone?.replace(/\D/g, '') || '';
  const email = orderData.email || '';
  
  const text = encodeURIComponent(`Hello ${name}, your order #${orderId} has been ${statusLabel}. Thank you for shopping with Popular Kitchen!`);
  const subject = encodeURIComponent(`Order Update - Popular Kitchen #${orderId}`);

  const buttons = [];
  
  // WhatsApp only if phone exists
  if (phone) {
    // Ensure numeric characters only for the URL
    const cleanPhone = phone.startsWith('91') ? phone : '91' + phone;
    buttons.push([{ 
      text: "📱 Message WhatsApp", 
      url: `https://wa.me/${cleanPhone}?text=${text}` 
    }]);
  }

  // Email only if email exists (Telegram requires HTTP/HTTPS URLs for buttons)
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
<b>Email:</b> ${escapeHTML(orderData.email || 'Not Provided')}
<b>Total:</b> ₹${orderData.totalAmount?.toLocaleString('en-IN') || '0'}

<b>Items:</b>
${itemsList}

<b>Address:</b>
<i>${escapeHTML(orderData.address)}</i>

<a href="${window.location.origin}/admin/orders">View in Admin Dashboard</a>
  `;

  const buttons = getContactButtons(orderId, orderData, 'received');
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
<b>Phone:</b> ${escapeHTML(orderData.phone)}
<b>Email:</b> ${escapeHTML(orderData.email || 'Not Provided')}

<b>Status:</b> ${escapeHTML(oldStatus)} ➔ <b>${escapeHTML(newStatus.toUpperCase())}</b>
${adminNote ? `<b>Note:</b> ${escapeHTML(adminNote)}` : ''}

<a href="${window.location.origin}/admin/orders">Go to Dashboard</a>
  `;

  const buttons = getContactButtons(orderId, orderData, newStatus);
  
  // Add Download Invoice button for confirmed orders
  if (newStatus === 'confirmed') {
    buttons.push([{ 
      text: "📄 Download Invoice", 
      url: `${window.location.origin}/admin/invoice/${orderId}`
    }]);
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
