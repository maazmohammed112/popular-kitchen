import admin from 'firebase-admin';

// Initialize Firebase Admin with Service Account from environment variables
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const messaging = admin.messaging();

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { token, title, body, data } = JSON.parse(event.body);

    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'FCM Token is required' }) };
    }

    const message = {
      notification: {
        title: title || 'Order Update',
        body: body || 'Your order status has been updated.'
      },
      token: token,
      data: data || {}
    };

    const response = await messaging.send(message);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: response })
    };
  } catch (error) {
    console.error('Push Notification Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
