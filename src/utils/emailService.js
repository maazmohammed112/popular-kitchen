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
  let statusColor = "#1A354A"; // Primary Blue

  switch (status) {
    case 'pending':
      statusMessage = `We have received your order <strong>${shortId}</strong>. We'll update you shortly.`;
      statusColor = "#435E91"; // Secondary Blue
      break;
    case 'confirmed':
      statusMessage = `Your order <strong>${shortId}</strong> has been confirmed! We are preparing it now.`;
      statusColor = "#1A354A";
      break;
    case 'delivered':
      statusMessage = `Your order <strong>${shortId}</strong> has been delivered. Thank you for choosing Primkart Kitchenware!`;
      statusColor = "#10B981"; // Success remains green but integrated into blue design
      break;
    case 'cancelled':
      statusColor = "#E53E3E";
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
    <tr style="border-bottom: 1px solid #E2E8F0;">
      <td style="padding: 16px 0;">
        <div style="font-weight: 700; color: #1A354A; font-size: 15px;">${item.title}</div>
        <div style="font-size: 12px; color: #435E91; margin-top: 4px;">Qty: ${item.quantity} ${item.size ? `| Size: ${item.size}` : ''}</div>
      </td>
      <td style="padding: 16px 0; text-align: right; font-weight: 800; color: #1A354A; font-size: 15px;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const baseTotal = order.customTotal || totalAmount || 0;
  const delivery = order.deliveryCharge || 0;
  const finalTotal = baseTotal + delivery;

  return `
    <div style="background-color: #F0F4F8; padding: 50px 20px; font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(26, 53, 74, 0.05);">
        <!-- Header Section -->
        <tr>
          <td align="center" style="padding: 40px 40px; background: linear-gradient(135deg, #1A354A 0%, #435E91 100%);">
            <img src="https://primkart.app/logo.png" alt="Primkart Kitchenware" style="width: 70px; height: 70px; border-radius: 18px; border: 3px solid rgba(255,255,255,0.2); margin-bottom: 15px; background: white;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">PRIMKART KITCHENWARE</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 13px; font-weight: 600; letter-spacing: 0.02em;">PREMIUM KITCHEN SOLUTIONS</p>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 45px 40px;">
            <h2 style="margin: 0 0 15px 0; font-size: 22px; font-weight: 800; color: #1A354A;">Hello ${customerName},</h2>
            <p style="margin: 0 0 35px 0; font-size: 16px; line-height: 1.6; color: #435E91;">${statusMessage}</p>
            
            <!-- Dynamic Status Badge -->
            <div style="background-color: ${statusColor}10; border: 2px solid ${statusColor}; border-radius: 20px; padding: 25px; text-align: center; margin-bottom: 40px;">
              <span style="display: block; font-size: 11px; font-weight: 800; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">Order Reference: #${shortId}</span>
              <span style="font-size: 28px; font-weight: 900; color: ${statusColor}; text-transform: uppercase;">${status}</span>
            </div>
 
            <!-- Order Table -->
            <div style="margin-bottom: 10px; border-bottom: 2px solid #1A354A; padding-bottom: 10px;">
               <h3 style="margin: 0; font-size: 14px; font-weight: 900; color: #1A354A; text-transform: uppercase; letter-spacing: 0.1em;">Order Summary</h3>
            </div>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 40px;">
              ${itemsList}
              ${delivery > 0 ? `
              <tr>
                <td style="padding: 15px 0 0 0; font-size: 14px; color: #435E91;">Delivery Charges</td>
                <td align="right" style="padding: 15px 0 0 0; font-size: 14px; color: #1A354A;">₹${Number(delivery).toLocaleString('en-IN')}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 25px 0 0 0; font-size: 16px; font-weight: 700; color: #435E91;">Total Payable</td>
                <td align="right" style="padding: 25px 0 0 0; font-size: 32px; font-weight: 900; color: #1A354A;">₹${Number(finalTotal).toLocaleString('en-IN')}</td>
              </tr>
              ${order.discountAmount > 0 ? `
              <tr>
                <td colspan="2" align="right" style="padding-top: 5px; font-size: 13px; font-weight: 700; color: #10B981;">
                  ✓ Special Discount Applied
                </td>
              </tr>
              ` : ''}
            </table>

            <!-- Support & Actions -->
            <div style="background-color: #F8FAFC; border-radius: 24px; padding: 30px; text-align: center; border: 1px dashed #CBD5E1;">
              <p style="margin: 0 0 20px 0; font-size: 15px; font-weight: 600; color: #1A354A;">Need any assistance with your order?</p>
              <a href="https://wa.me/919108167067" style="display: inline-block; padding: 16px 35px; background-color: #1A354A; color: #ffffff; text-decoration: none; border-radius: 16px; font-weight: 800; font-size: 15px; box-shadow: 0 8px 20px rgba(26, 53, 74, 0.15);">Contact on WhatsApp</a>
            </div>
          </td>
        </tr>

        <!-- Branding Footer -->
        <tr>
          <td style="padding: 0 40px 45px 40px; text-align: center;">
            <div style="margin-bottom: 20px; border-top: 1px solid #E2E8F0; padding-top: 25px;">
              <span style="font-weight: 800; color: #1A354A; font-size: 14px;">PRIMKART KITCHENWARE</span>
            </div>
            <p style="margin: 0; font-size: 12px; line-height: 1.8; color: #435E91; font-weight: 600;">
              &copy; ${new Date().getFullYear()} Primkart Kitchenware. All rights reserved.<br>
              Bangalore, Karnataka, India
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
};
