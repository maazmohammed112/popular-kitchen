/**
 * Utility to send Telegram notifications for Admin tracking.
 * Uses a free Telegram Bot to alert the owner immediately of new orders or cancellations.
 */

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

export const sendTelegramMessage = async (message) => {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("Telegram credentials missing in .env");
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
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
<b>Total:</b> ₹${orderData.totalAmount.toLocaleString('en-IN')}

<b>Items:</b>
${itemsList}

<b>Address:</b>
<i>${orderData.address}</i>

<a href="${window.location.origin}/admin/orders">View details in Admin Dashboard</a>
  `;

  return sendTelegramMessage(message);
};

/**
 * Format a 'Status Update' notification
 */
export const notifyStatusUpdate = async (orderId, oldStatus, newStatus, adminNote) => {
  const message = `
<b>🔄 ORDER UPDATE</b>

<b>Order ID:</b> <code>#${orderId}</code>
<b>Status:</b> ${oldStatus} ➔ <b>${newStatus}</b>
${adminNote ? `<b>Note:</b> ${adminNote}` : ''}

<a href="${window.location.origin}/admin/orders">Go to Dashboard</a>
  `;

  return sendTelegramMessage(message);
};

/**
 * Format a 'Cancellation' notification
 */
export const notifyOrderCancelled = async (orderId, cancelledBy) => {
  const message = `
<b>❌ ORDER CANCELLED</b>

<b>Order ID:</b> <code>#${orderId}</code>
<b>Cancelled By:</b> ${cancelledBy === 'admin' ? 'Admin' : 'Customer'}

<a href="${window.location.origin}/admin/orders">Manage Orders</a>
  `;

  return sendTelegramMessage(message);
};
