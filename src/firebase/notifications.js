/**
 * Utility to send Telegram notifications for Admin tracking.
 * Uses a free Telegram Bot to alert the owner immediately of new orders or cancellations.
 */

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

export const sendTelegramMessage = async (message, buttons = null) => {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("Telegram credentials missing in .env");
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  try {
    const body = {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    if (buttons) {
      body.reply_markup = JSON.stringify({
        inline_keyboard: buttons
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Telegram API Error:", err);
    }
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
  }
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

  const buttons = [
    [
      { 
        text: "📱 Message WhatsApp", 
        url: `https://wa.me/${phone.startsWith('91') ? phone : '91'+phone}?text=${text}` 
      }
    ]
  ];

  if (email) {
    buttons.push([
      { 
        text: "✉️ Send Email", 
        url: `mailto:${email}?subject=${subject}&body=${text}` 
      }
    ]);
  }

  return buttons;
};

/**
 * Format a 'New Order' notification
 */
export const notifyNewOrder = async (orderId, orderData) => {
  const itemsList = orderData.items
    .map(item => `• ${item.quantity}x ${item.title} (${item.size})`)
    .join('\n');

  const message = `
<b>🛍️ NEW ORDER RECEIVED!</b>

<b>Order ID:</b> <code>#${orderId}</code>
<b>Customer:</b> ${orderData.customerName}
<b>Phone:</b> ${orderData.phone}
<b>Email:</b> ${orderData.email || '<i>Not Provided</i>'}
<b>Total:</b> ₹${orderData.totalAmount.toLocaleString('en-IN')}

<b>Items:</b>
${itemsList}

<b>Address:</b>
<i>${orderData.address}</i>

<a href="${window.location.origin}/admin/orders">View in Admin Dashboard</a>
  `;

  const buttons = getContactButtons(orderId, orderData, 'received');
  return sendTelegramMessage(message, buttons);
};

/**
 * Format a 'Status Update' notification
 */
export const notifyStatusUpdate = async (orderId, orderData, oldStatus, newStatus, adminNote) => {
  const message = `
<b>🔄 ORDER UPDATE</b>

<b>Order ID:</b> <code>#${orderId}</code>
<b>Customer:</b> ${orderData.customerName}
<b>Phone:</b> ${orderData.phone}
<b>Email:</b> ${orderData.email || '<i>Not Provided</i>'}

<b>Status:</b> ${oldStatus} ➔ <b>${newStatus.toUpperCase()}</b>
${adminNote ? `<b>Note:</b> ${adminNote}` : ''}

<a href="${window.location.origin}/admin/orders">Go to Dashboard</a>
  `;

  const buttons = getContactButtons(orderId, orderData, newStatus);
  return sendTelegramMessage(message, buttons);
};

/**
 * Format a 'Cancellation' notification
 */
export const notifyOrderCancelled = async (orderId, orderData, cancelledBy) => {
  const message = `
<b>❌ ORDER CANCELLED</b>

<b>Order ID:</b> <code>#${orderId}</code>
<b>Customer:</b> ${orderData.customerName}
<b>Phone:</b> ${orderData.phone}
<b>Email:</b> ${orderData.email || '<i>Not Provided</i>'}

<b>Cancelled By:</b> ${cancelledBy === 'admin' ? 'Admin' : 'Customer'}

<a href="${window.location.origin}/admin/orders">Manage Orders</a>
  `;

  const buttons = getContactButtons(orderId, orderData, 'cancelled');
  return sendTelegramMessage(message, buttons);
};
