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
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 0;">
        <div style="font-weight: 600; color: #1e293b;">${item.title}</div>
        <div style="font-size: 12px; color: #64748b;">Qty: ${item.quantity} ${item.size ? `| Size: ${item.size}` : ''}</div>
      </td>
      <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #1e293b;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const finalTotal = order.customTotal || totalAmount || 0;

  return `
    <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);">
        <!-- Header -->
        <tr>
          <td align="center" style="padding: 40px 30px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
            <div style="display: inline-block; background-color: #f8fafc; padding: 12px; border-radius: 20px; margin-bottom: 16px;">
              <img src="https://popularkitchen.store/logo.png" alt="Popular Kitchen" style="width: 56px; height: 56px; display: block;">
            </div>
            <h1 style="color: #0f172a; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">POPULAR KITCHEN</h1>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px; font-weight: 500;">Premium Kitchen Equipment</p>
          </td>
        </tr>
        
        <!-- Content -->
        <tr>
          <td style="padding: 40px 40px;">
            <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;">Hello ${customerName},</h2>
            <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #475569;">${statusMessage}</p>
            
            <!-- Status Badge -->
            <div style="background-color: ${statusColor}08; border: 1px solid ${statusColor}20; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 40px;">
              <span style="display: block; font-size: 12px; font-weight: 800; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; opacity: 0.8;">Order Status</span>
              <span style="font-size: 24px; font-weight: 800; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.02em;">${status}</span>
            </div>

            <!-- Order Table -->
            <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
               <h3 style="margin: 0; font-size: 13px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Order Summary</h3>
               <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">#${shortId}</span>
            </div>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
              ${itemsList}
              <tr>
                <td style="padding: 24px 0 0 0; font-size: 16px; font-weight: 600; color: #64748b;">Total Amount</td>
                <td align="right" style="padding: 24px 0 0 0; font-size: 26px; font-weight: 800; color: #0f172a;">₹${Number(finalTotal).toLocaleString('en-IN')}</td>
              </tr>
              ${order.discountAmount > 0 ? `
              <tr>
                <td colspan="2" align="right" style="padding-top: 4px; font-size: 12px; font-weight: 600; color: #10b981;">
                  Includes Special Discount
                </td>
              </tr>
              ` : ''}
            </table>

            <!-- Support -->
            <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 20px; padding: 24px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 500; color: #475569;">Have questions? We're here to help.</p>
              <a href="https://wa.me/919108167067" style="display: inline-block; padding: 14px 32px; background-color: #25D366; color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.2);">Chat on WhatsApp</a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 0 40px 40px 40px; text-align: center;">
            <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8; font-weight: 500;">
              &copy; ${new Date().getFullYear()} Popular Kitchen. All rights reserved.<br>
              Bangalore, Karnataka, India
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
};
