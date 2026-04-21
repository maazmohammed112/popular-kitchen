/**
 * Sends an email using the Netlify serverless function (which uses Brevo).
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlContent - Email body in HTML
 */
export const sendEmail = async ({ to, subject, htmlContent }) => {
  if (!to) return; // Silent skip if no email

  try {
    const response = await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, htmlContent }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send email");
    }

    return await response.json();
  } catch (error) {
    console.error("Email service error:", error);
    // We don't throw here to avoid breaking the main UI flow if email fails
    return null;
  }
};

/**
 * Generates the HTML content for an order update email.
 * @param {Object} order - The order object
 * @returns {string} HTML content
 */
export const getOrderEmailTemplate = (order) => {
  const { id, status, customerName, items, totalAmount, cancelledBy } = order;
  const shortId = id.slice(0, 8).toUpperCase();
  
  let statusMessage = "";
  let statusColor = "#3B82F6"; // Default Blue

  switch (status) {
    case 'pending':
      statusMessage = `We have received your order <strong>${shortId}</strong>. Please allow some hours for further updates.`;
      statusColor = "#6B7280";
      break;
    case 'confirmed':
      statusMessage = `Your order <strong>${shortId}</strong> has been confirmed! We are preparing it now.`;
      statusColor = "#F59E0B";
      break;
    case 'delivered':
      statusMessage = `Your order <strong>${shortId}</strong> has been delivered. Enjoy your meal!`;
      statusColor = "#10B981";
      break;
    case 'cancelled':
      statusColor = "#EF4444";
      if (cancelledBy === 'user') {
        statusMessage = `Your order <strong>${shortId}</strong> has been cancelled as per your request.`;
      } else {
        statusMessage = `We regret to inform you that your order <strong>${shortId}</strong> has been cancelled. Please contact us for more details.`;
      }
      break;
    default:
      statusMessage = `Update for your order <strong>${shortId}</strong>: Status is now ${status.toUpperCase()}.`;
  }

  const itemsList = items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 0;">${item.title} (x${item.quantity})</td>
      <td style="padding: 12px 0; text-align: right;">₹${item.price * item.quantity}</td>
    </tr>
  `).join('');

  return `
    <div style="background-color: #f8fafc; padding: 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <tr>
          <td align="center" style="padding: 40px 0 30px 0; background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
            <div style="display: inline-block; background-color: #ffffff; padding: 10px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-bottom: 15px;">
              <img src="https://popularkitchen.store/logo.png" alt="Popular Kitchen" style="width: 48px; height: 48px; display: block;" onerror="this.src='https://res.cloudinary.com/dxonu07sc/image/upload/v1/logos/pk-logo-blue.png'">
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">POPULAR KITCHEN</h1>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Hello ${customerName},</h2>
            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #475569;">${statusMessage}</p>
            
            <!-- Status Badge -->
            <div style="background-color: ${statusColor}10; border: 1px solid ${statusColor}30; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 40px;">
              <span style="display: block; font-size: 11px; font-weight: 800; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Order Status</span>
              <span style="font-size: 22px; font-weight: 800; color: ${statusColor}; text-transform: uppercase;">${status}</span>
            </div>

            <!-- Order Table -->
            <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Your Order Details</h3>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              ${itemsList}
              <tr>
                <td style="padding: 25px 0 0 0; border-top: 2px solid #f1f5f9; font-size: 16px; font-weight: 600; color: #64748b;">Total Amount</td>
                <td align="right" style="padding: 25px 0 0 0; border-top: 2px solid #f1f5f9; font-size: 24px; font-weight: 800; color: #0f172a;">₹${totalAmount}</td>
              </tr>
            </table>

            <!-- Support -->
            <div style="background-color: #f1f5f9; border-radius: 16px; padding: 20px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #475569;">Need help with your order?</p>
              <a href="https://wa.me/919108167067" style="display: inline-block; padding: 10px 20px; background-color: #25D366; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">Chat on WhatsApp</a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 0 30px 40px 30px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} Popular Kitchen. All rights reserved.<br>
              This is an automatic notification regarding your recent order.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
};
