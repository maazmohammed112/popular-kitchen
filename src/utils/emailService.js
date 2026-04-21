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
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
      <div style="background-color: #0F172A; padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Popular Kitchen</h1>
      </div>
      
      <div style="padding: 40px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 0 0 16px 16px;">
        <h2 style="margin-top: 0; color: #111827;">Hello ${customerName},</h2>
        <p style="font-size: 16px; margin-bottom: 24px;">${statusMessage}</p>
        
        <div style="background-color: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 16px; margin-bottom: 32px; border-radius: 4px;">
          <span style="display: block; font-size: 12px; text-transform: uppercase; color: ${statusColor}; font-weight: bold; margin-bottom: 4px;">Current Status</span>
          <span style="font-size: 18px; font-weight: bold; color: ${statusColor}; text-transform: uppercase;">${status}</span>
        </div>

        <h3 style="border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; margin-bottom: 16px;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          ${itemsList}
          <tr>
            <td style="padding: 20px 0 0; font-weight: bold; font-size: 16px;">Total Amount</td>
            <td style="padding: 20px 0 0; font-weight: bold; font-size: 18px; text-align: right; color: #111827;">₹${totalAmount}</td>
          </tr>
        </table>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center; color: #6b7280; font-size: 12px;">
          <p>If you have any questions, feel free to reply to this email or contact us on WhatsApp.</p>
          <p style="margin-top: 10px; font-weight: bold;">Thank you for choosing Popular Kitchen!</p>
          <p>&copy; ${new Date().getFullYear()} Popular Kitchen Team</p>
        </div>
      </div>
    </div>
  `;
};
