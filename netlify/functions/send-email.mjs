export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { to, subject, htmlContent, senderName = "Primkart Kitchenware" } = JSON.parse(event.body);

  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!BREVO_API_KEY) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Brevo API Key not configured" }) 
    };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: senderName, email: "mohammed@popularkitchen.store" },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
        replyTo: { email: "mohammed@popularkitchen.store" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email sent successfully", data })
    };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
