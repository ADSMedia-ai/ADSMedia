# ADSMedia E-commerce Webhooks Integration

Handle e-commerce events from various platforms and send transactional emails via ADSMedia.

## Supported Platforms

- Gumroad
- Lemon Squeezy
- Paddle
- Stripe
- Shopify
- BigCommerce

## Universal Webhook Handler

```javascript
// ecommerce-webhook-handler.js
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf } }));

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

async function sendEmail(to, toName, subject, html, fromName = 'Store') {
  const response = await fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, to_name: toName, subject, html, from_name: fromName }),
  });
  return response.json();
}

// --- GUMROAD ---
app.post('/webhook/gumroad', async (req, res) => {
  const { seller_id, product_id, product_name, email, full_name, price, variants, license_key } = req.body;
  
  // Order confirmation email
  await sendEmail(
    email,
    full_name,
    `Your purchase: ${product_name}`,
    `
      <h1>Thank you for your purchase!</h1>
      <p>Hi ${full_name},</p>
      <p>Your order has been confirmed:</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
        <p><strong>Product:</strong> ${product_name}</p>
        ${variants ? `<p><strong>Variant:</strong> ${variants}</p>` : ''}
        <p><strong>Price:</strong> $${(price / 100).toFixed(2)}</p>
        ${license_key ? `<p><strong>License Key:</strong> <code>${license_key}</code></p>` : ''}
      </div>
      <p>Thank you for your business!</p>
    `
  );
  
  res.sendStatus(200);
});

// --- LEMON SQUEEZY ---
app.post('/webhook/lemonsqueezy', async (req, res) => {
  const signature = req.headers['x-signature'];
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }
  
  const { meta, data } = req.body;
  
  switch (meta.event_name) {
    case 'order_created':
      const { customer_email, customer_name, total_formatted, order_number, urls } = data.attributes;
      
      await sendEmail(
        customer_email,
        customer_name,
        `Order Confirmed: #${order_number}`,
        `
          <h1>Order Confirmed!</h1>
          <p>Hi ${customer_name},</p>
          <p>Thank you for your order!</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Order #:</strong> ${order_number}</p>
            <p><strong>Total:</strong> ${total_formatted}</p>
          </div>
          <p><a href="${urls.receipt}" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Receipt</a></p>
        `
      );
      break;
      
    case 'subscription_created':
      const sub = data.attributes;
      await sendEmail(
        sub.customer_email,
        sub.customer_name,
        'Subscription Activated!',
        `
          <h1>Welcome to your subscription!</h1>
          <p>Your subscription is now active.</p>
          <p><strong>Plan:</strong> ${sub.product_name}</p>
          <p><strong>Price:</strong> ${sub.total_formatted} / ${sub.billing_anchor}</p>
        `
      );
      break;
      
    case 'subscription_cancelled':
      const cancelled = data.attributes;
      await sendEmail(
        cancelled.customer_email,
        cancelled.customer_name,
        'Subscription Cancelled',
        `
          <h1>Your subscription has been cancelled</h1>
          <p>We're sorry to see you go.</p>
          <p>Your access will remain active until ${cancelled.ends_at}.</p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- PADDLE ---
app.post('/webhook/paddle', async (req, res) => {
  const { alert_name, email, marketing_consent, ...data } = req.body;
  
  switch (alert_name) {
    case 'payment_succeeded':
      await sendEmail(
        email,
        data.customer_name || 'Customer',
        'Payment Received - Thank You!',
        `
          <h1>Payment Confirmed!</h1>
          <p>We've received your payment of ${data.currency}${data.sale_gross}.</p>
          <p><strong>Order:</strong> ${data.order_id}</p>
          <p><strong>Product:</strong> ${data.product_name}</p>
          <p><a href="${data.receipt_url}">View Receipt</a></p>
        `
      );
      break;
      
    case 'subscription_created':
      await sendEmail(
        email,
        data.customer_name || 'Customer',
        'Welcome to Your Subscription!',
        `
          <h1>Subscription Active!</h1>
          <p>Your subscription to ${data.product_name} is now active.</p>
          <p><strong>Next billing:</strong> ${data.next_bill_date}</p>
        `
      );
      break;
      
    case 'subscription_cancelled':
      await sendEmail(
        email,
        data.customer_name || 'Customer',
        'Subscription Cancelled',
        `
          <h1>Subscription Cancelled</h1>
          <p>Your subscription has been cancelled.</p>
          <p>Access continues until: ${data.cancellation_effective_date}</p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- STRIPE ---
app.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  try {
    // Verify signature (using Stripe SDK recommended)
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  const { type, data } = event;
  
  switch (type) {
    case 'checkout.session.completed':
      const session = data.object;
      await sendEmail(
        session.customer_email,
        session.customer_details?.name || 'Customer',
        'Order Confirmed!',
        `
          <h1>Thank you for your purchase!</h1>
          <p>Order ID: ${session.id}</p>
          <p>Total: ${session.currency.toUpperCase()} ${(session.amount_total / 100).toFixed(2)}</p>
        `
      );
      break;
      
    case 'invoice.paid':
      const invoice = data.object;
      await sendEmail(
        invoice.customer_email,
        invoice.customer_name || 'Customer',
        'Invoice Paid',
        `
          <h1>Payment Received!</h1>
          <p>Invoice #${invoice.number} has been paid.</p>
          <p>Amount: ${invoice.currency.toUpperCase()} ${(invoice.amount_paid / 100).toFixed(2)}</p>
          <p><a href="${invoice.hosted_invoice_url}">View Invoice</a></p>
        `
      );
      break;
      
    case 'customer.subscription.created':
      // Handle new subscription
      break;
      
    case 'customer.subscription.deleted':
      // Handle cancelled subscription
      break;
  }
  
  res.json({ received: true });
});

// --- SHOPIFY ---
app.post('/webhook/shopify', async (req, res) => {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('base64');
  
  if (hmac !== hash) {
    return res.status(401).send('Invalid signature');
  }
  
  const topic = req.headers['x-shopify-topic'];
  const order = req.body;
  
  switch (topic) {
    case 'orders/create':
      await sendEmail(
        order.email,
        `${order.customer?.first_name} ${order.customer?.last_name}`,
        `Order Confirmed: #${order.order_number}`,
        `
          <h1>Thank you for your order!</h1>
          <p>Order #${order.order_number}</p>
          <h3>Items:</h3>
          ${order.line_items.map(item => `
            <p>${item.name} x ${item.quantity} - ${order.currency} ${item.price}</p>
          `).join('')}
          <p><strong>Total:</strong> ${order.currency} ${order.total_price}</p>
        `
      );
      break;
      
    case 'orders/fulfilled':
      await sendEmail(
        order.email,
        order.customer?.first_name,
        `Your order #${order.order_number} has shipped!`,
        `
          <h1>Your order is on its way!</h1>
          <p>Tracking: ${order.fulfillments?.[0]?.tracking_number || 'Pending'}</p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`E-commerce webhook handler running on port ${PORT}`));
```

## Email Templates

### Order Confirmation

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #4F46E5; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .order-details { background: #f9f9f9; padding: 20px; border-radius: 8px; }
    .item { border-bottom: 1px solid #eee; padding: 10px 0; }
    .total { font-size: 24px; font-weight: bold; color: #4F46E5; }
    .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Order #{{order.number}}</p>
    </div>
    <div class="content">
      <p>Hi {{customer.name}},</p>
      <p>Thank you for your purchase! Here's your order summary:</p>
      
      <div class="order-details">
        {{#each items}}
        <div class="item">
          <strong>{{name}}</strong><br>
          Qty: {{quantity}} × {{price}}
        </div>
        {{/each}}
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
          <p>Subtotal: {{subtotal}}</p>
          <p>Shipping: {{shipping}}</p>
          <p>Tax: {{tax}}</p>
          <p class="total">Total: {{total}}</p>
        </div>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{receipt_url}}" class="button">View Receipt</a>
      </p>
    </div>
  </div>
</body>
</html>
```

## Platform Setup

### Gumroad

1. Go to **Settings** → **Advanced** → **Ping**
2. Add URL: `https://your-domain.com/webhook/gumroad`

### Lemon Squeezy

1. Go to **Settings** → **Webhooks**
2. Add URL and select events
3. Copy signing secret

### Paddle

1. Go to **Developer Tools** → **Alerts**
2. Add webhook URL for each alert type

### Stripe

```bash
stripe listen --forward-to localhost:3000/webhook/stripe
```

### Shopify

1. Go to **Settings** → **Notifications** → **Webhooks**
2. Create webhooks for orders/create, orders/fulfilled, etc.

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

