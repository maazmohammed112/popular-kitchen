import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN;
// Update this with your actual Netlify domain if different
const SITE_URL = 'https://popularkitchen.store'; 
const WEBHOOK_URL = `${SITE_URL}/.netlify/functions/telegram-bot`;

async function setWebhook() {
  if (!BOT_TOKEN) {
    console.error("❌ VITE_TELEGRAM_BOT_TOKEN not found in .env.local");
    return;
  }

  console.log(`📡 Setting webhook for Bot Token: ${BOT_TOKEN.substring(0, 5)}...`);
  console.log(`🔗 Target URL: ${WEBHOOK_URL}`);

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}`;
    const response = await axios.get(url);
    
    if (response.data.ok) {
      console.log("✅ Webhook successfully set!");
      console.log("📝 Info:", response.data.description);
    } else {
      console.log("❌ Failed to set webhook.");
      console.log(response.data);
    }
  } catch (error) {
    console.error("❌ Error setting webhook:", error.response?.data || error.message);
  }
}

setWebhook();
