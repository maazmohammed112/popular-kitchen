import admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Fallback if service account isn't provided yet
    console.error("FIREBASE_SERVICE_ACCOUNT missing in environment variables.");
  }
}

const db = admin.firestore();
const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.VITE_TELEGRAM_CHAT_ID;

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    const message = payload.message;

    if (!message || !message.text) {
      return { statusCode: 200, body: 'OK' };
    }

    const chatId = message.chat.id.toString();
    const text = message.text.trim();

    // Security Check - Support comma-separated IDs
    const adminIds = ADMIN_CHAT_ID?.toString().split(',').map(id => id.trim()).filter(Boolean) || [];
    if (!adminIds.includes(chatId)) {
      console.warn(`Unauthorized access attempt from Chat ID: ${chatId}`);
      return { statusCode: 200, body: 'OK' }; // Don't respond to unauthorized users
    }

    // Process commands
    if (text.startsWith('/')) {
      const args = text.split(' ');
      const command = args[0].toLowerCase();

      switch (command) {
        case '/today':
          await handleTodaySummary(chatId);
          break;
        case '/yesterday':
          await handleYesterdaySummary(chatId);
          break;
        case '/month':
          await handleMonthSummary(chatId, args[1], args[2]);
          break;
        case '/order':
          await handleOrderLookup(chatId, args[1]);
          break;
        case '/pending':
          await handlePendingOrders(chatId);
          break;
        case '/stats':
          await handleStats(chatId);
          break;
        case '/help':
        case '/start':
          await sendHelp(chatId);
          break;
        default:
          await sendMessage(chatId, "❌ Unknown command. Type /help to see available commands.");
      }
    }

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('Error handling webhook:', error);
    return { statusCode: 200, body: 'OK' }; // Always return 200 to Telegram
  }
};

async function handleTodaySummary(chatId) {
  const now = new Date();
  const start = new Date(now.setHours(0, 0, 0, 0));
  const end = new Date(now.setHours(23, 59, 59, 999));
  
  await sendDateRangeSummary(chatId, "TODAY'S ORDERS 📅", start, end);
}

async function handleYesterdaySummary(chatId) {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const start = new Date(date.setHours(0, 0, 0, 0));
  const end = new Date(date.setHours(23, 59, 59, 999));
  
  await sendDateRangeSummary(chatId, "YESTERDAY'S ORDERS 🗓️", start, end);
}

async function handleMonthSummary(chatId, monthStr, yearStr) {
  const now = new Date();
  const month = monthStr ? (parseInt(monthStr) - 1) : now.getMonth();
  const year = yearStr ? parseInt(yearStr) : now.getFullYear();

  if (isNaN(month) || isNaN(year) || month < 0 || month > 11) {
    return sendMessage(chatId, "❌ Invalid format. Use: `/month MM YYYY` (e.g., `/month 06 2024`)", true);
  }

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const monthName = start.toLocaleString('default', { month: 'long' });

  await sendDateRangeSummary(chatId, `${monthName.toUpperCase()} ${year} ORDERS 📊`, start, end);
}

async function sendDateRangeSummary(chatId, title, start, end) {
  try {
    const snapshot = await db.collection('orders')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
      .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(end))
      .get();

    if (snapshot.empty) {
      return sendMessage(chatId, `<b>${title}</b>\n\nNo orders found for this period.`);
    }

    let totalRevenue = 0;
    let orderCount = snapshot.size;
    let pendingCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      totalRevenue += data.totalAmount || 0;
      if (data.status === 'pending' || data.status === 'confirmed') pendingCount++;
    });

    const message = `
<b>${title}</b>

🛍️ <b>Total Orders:</b> ${orderCount}
💰 <b>Total Revenue:</b> ₹${totalRevenue.toLocaleString('en-IN')}
🕒 <b>Pending/Confirmed:</b> ${pendingCount}

<i>For full details and itemized lists, please check your Admin Dashboard.</i>
    `;
    await sendMessage(chatId, message);
  } catch (error) {
    console.error('Query error:', error);
    await sendMessage(chatId, "❌ Error retrieving data from Firebase.");
  }
}

async function handleOrderLookup(chatId, orderId) {
  if (!orderId) {
    return sendMessage(chatId, "❌ Please provide an Order ID. Use: `/order [ID]`");
  }

  try {
    const doc = await db.collection('orders').doc(orderId).get();
    if (!doc.exists) {
      return sendMessage(chatId, `❌ Order <code>#${orderId}</code> not found.`);
    }

    const data = doc.data();
    const message = `
<b>📦 ORDER DETAILS</b>

<b>ID:</b> <code>#${orderId}</code>
<b>Customer:</b> ${data.customerName}
<b>Phone:</b> ${data.phone}
<b>Total Amount:</b> ₹${data.totalAmount.toLocaleString('en-IN')}
<b>Status:</b> <b>${data.status.toUpperCase()}</b>

<a href="https://popularkitchen.store/admin/orders">View in Dashboard</a>
    `;
    await sendMessage(chatId, message);
  } catch (error) {
    await sendMessage(chatId, "❌ Error looking up order.");
  }
}

async function handlePendingOrders(chatId) {
  try {
    const snapshot = await db.collection('orders')
      .where('status', 'in', ['pending', 'confirmed'])
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (snapshot.empty) {
      return sendMessage(chatId, "✅ No pending orders currently.");
    }

    let list = snapshot.docs.map(doc => {
      const data = doc.data();
      return `• <code>#${doc.id}</code> - ₹${data.totalAmount} (${data.customerName})`;
    }).join('\n');

    const message = `
<b>⏳ PENDING ORDERS (Last 10)</b>

${list}

<a href="https://popularkitchen.store/admin/orders">Go to Orders Management</a>
    `;
    await sendMessage(chatId, message);
  } catch (error) {
    console.error(error);
    await sendMessage(chatId, "❌ Error fetching pending orders.");
  }
}

async function handleStats(chatId) {
  try {
    const snapshot = await db.collection('orders').get();
    const stats = {};
    let totalRevenue = 0;

    snapshot.forEach(doc => {
      const status = doc.data().status || 'unknown';
      stats[status] = (stats[status] || 0) + 1;
      if (status !== 'cancelled') {
        totalRevenue += doc.data().totalAmount || 0;
      }
    });

    const list = Object.entries(stats)
      .map(([status, count]) => `• ${status.charAt(0).toUpperCase() + status.slice(1)}: <b>${count}</b>`)
      .sort()
      .join('\n');

    const message = `
<b>📊 OVERALL STORE STATS</b>

${list}

💵 <b>Total Valid Revenue:</b> ₹${totalRevenue.toLocaleString('en-IN')}
    `;
    await sendMessage(chatId, message);
  } catch (error) {
    await sendMessage(chatId, "❌ Error calculating stats.");
  }
}

async function sendHelp(chatId) {
  const message = `
<b>🤖 PRIMKART KITCHENWARE ADMIN BOT</b>

Use these commands to manage your orders:

📅 /today - Today's order summary
🗓️ /yesterday - Yesterday's order summary
📊 /month [MM] [YYYY] - Specific month report
📦 /order [ID] - Specific order lookup
⏳ /pending - List active/pending orders
📈 /stats - Overall store performance

<i>I only respond to authorized admin Chat IDs.</i>
  `;
  await sendMessage(chatId, message);
}

async function sendMessage(chatId, text, isMarkdown = false) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: isMarkdown ? 'Markdown' : 'HTML',
      disable_web_page_preview: true
    });
  } catch (error) {
    console.error('Failed to send telegram message:', error?.response?.data || error.message);
  }
}
