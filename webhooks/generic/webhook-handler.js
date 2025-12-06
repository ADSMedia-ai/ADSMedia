/**
 * Generic Webhook Handler for ADSMedia
 * 
 * Deploy to: Vercel, Netlify Functions, AWS Lambda, Cloudflare Workers
 * 
 * This handler receives webhooks from various platforms and sends emails via ADSMedia
 */

const API_BASE_URL = 'https://api.adsmedia.live/v1';

async function sendEmail(apiKey, payload) {
  const response = await fetch(`${API_BASE_URL}/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}

// Template functions for different webhook sources
const templates = {
  // Form submissions (Tally, Fillout, Typeform, etc.)
  form_submission: (data) => ({
    subject: `New Form Submission: ${data.formName || 'Contact Form'}`,
    html: `
      <h1>New Form Submission</h1>
      <p>Form: ${data.formName || 'Unknown'}</p>
      <h3>Submitted Data:</h3>
      <table style="border-collapse: collapse; width: 100%;">
        ${Object.entries(data.fields || data).map(([key, value]) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>${key}</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${value}</td>
          </tr>
        `).join('')}
      </table>
    `,
  }),

  // New user signup
  user_signup: (data) => ({
    subject: `Welcome, ${data.name || 'New User'}!`,
    html: `
      <h1>Welcome to Our Platform!</h1>
      <p>Hi ${data.name || 'there'},</p>
      <p>Thank you for signing up. We're excited to have you!</p>
      <p>Your account has been created with email: ${data.email}</p>
    `,
  }),

  // Order placed
  order_placed: (data) => ({
    subject: `Order Confirmation #${data.orderId || data.id}`,
    html: `
      <h1>Thank You for Your Order!</h1>
      <p>Order #${data.orderId || data.id}</p>
      <p>Total: ${data.total || data.amount}</p>
      <p>We'll send you tracking information when it ships.</p>
    `,
  }),

  // Payment received
  payment_received: (data) => ({
    subject: `Payment Received - ${data.amount}`,
    html: `
      <h1>Payment Confirmed</h1>
      <p>Amount: ${data.amount}</p>
      <p>Transaction ID: ${data.transactionId || data.id}</p>
      <p>Thank you for your payment!</p>
    `,
  }),

  // Appointment booked
  appointment_booked: (data) => ({
    subject: `Appointment Confirmed - ${data.date || data.datetime}`,
    html: `
      <h1>Appointment Confirmed</h1>
      <p>Date: ${data.date || data.datetime}</p>
      <p>Time: ${data.time || ''}</p>
      <p>Service: ${data.service || data.type || 'Consultation'}</p>
      <p>We look forward to seeing you!</p>
    `,
  }),

  // Generic notification
  notification: (data) => ({
    subject: data.subject || 'Notification',
    html: data.html || data.message || `<p>${JSON.stringify(data)}</p>`,
  }),
};

/**
 * Main handler function
 */
async function handler(req) {
  // Get config from environment or headers
  const apiKey = process.env.ADSMEDIA_API_KEY || req.headers['x-adsmedia-key'];
  const defaultTo = process.env.NOTIFICATION_EMAIL || req.headers['x-notification-email'];

  if (!apiKey) {
    return { statusCode: 401, body: JSON.stringify({ error: 'API key required' }) };
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // Determine template type from body or query
    const templateType = body.type || body.event || req.query?.type || 'notification';
    const template = templates[templateType] || templates.notification;
    
    // Get recipient
    const to = body.to || body.email || body.recipient || defaultTo;
    
    if (!to) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Recipient email required' }) };
    }

    // Generate email content
    const emailContent = template(body.data || body);
    
    // Send email
    const result = await sendEmail(apiKey, {
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      from_name: body.from_name || 'Webhook Notification',
    });

    if (result.success) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message_id: result.data.message_id,
        }),
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: result.error }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

// Export for different platforms
module.exports = { handler };

// Vercel/Next.js
module.exports.default = async (req, res) => {
  const result = await handler(req);
  res.status(result.statusCode).json(JSON.parse(result.body));
};

// Netlify Functions
module.exports.handler = handler;

