# ADSMedia + Saleor Integration

Send transactional emails from Saleor e-commerce via ADSMedia.

## Overview

Saleor is a high-performance, composable e-commerce platform. This integration enables:
- Order confirmation emails
- Shipping notifications
- Customer account emails
- Promotional campaigns

## Setup

### 1. Saleor App

Create a Saleor App to intercept email events:

```typescript
// adsmedia-saleor-app/src/index.ts
import { createApp } from "@saleor/app-sdk";
import express from "express";

const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY!;
const SALEOR_APP_TOKEN = process.env.SALEOR_APP_TOKEN!;

async function sendEmail(to: string, toName: string, subject: string, html: string) {
  const response = await fetch("https://api.adsmedia.live/v1/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ADSMEDIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      to_name: toName,
      subject,
      html,
      from_name: "Your Store",
    }),
  });
  return response.json();
}

// Order Created Webhook
app.post("/webhooks/order-created", async (req, res) => {
  const { order } = req.body;
  
  const html = `
    <h1>Order Confirmed! 🎉</h1>
    <p>Hi ${order.billingAddress?.firstName || "Customer"},</p>
    <p>Thank you for your order #${order.number}.</p>
    
    <h2>Order Summary</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #f5f5f5;">
        <th style="padding: 10px; text-align: left;">Product</th>
        <th style="padding: 10px; text-align: right;">Qty</th>
        <th style="padding: 10px; text-align: right;">Price</th>
      </tr>
      ${order.lines.map((line: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${line.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${line.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${line.totalPrice.gross.amount} ${line.totalPrice.gross.currency}</td>
        </tr>
      `).join("")}
    </table>
    
    <p><strong>Total: ${order.total.gross.amount} ${order.total.gross.currency}</strong></p>
  `;

  await sendEmail(
    order.userEmail,
    order.billingAddress?.firstName || "",
    `Order Confirmation #${order.number}`,
    html
  );

  res.sendStatus(200);
});

// Order Fulfilled Webhook
app.post("/webhooks/order-fulfilled", async (req, res) => {
  const { order, fulfillment } = req.body;
  
  const trackingNumbers = fulfillment.lines
    .filter((l: any) => l.trackingNumber)
    .map((l: any) => l.trackingNumber);

  const html = `
    <h1>Your Order Has Shipped! 📦</h1>
    <p>Hi ${order.billingAddress?.firstName || "Customer"},</p>
    <p>Great news! Your order #${order.number} is on its way.</p>
    
    ${trackingNumbers.length > 0 ? `
      <h2>Tracking Information</h2>
      ${trackingNumbers.map((num: string) => `<p>Tracking: <strong>${num}</strong></p>`).join("")}
    ` : ""}
    
    <p>You'll receive your order soon!</p>
  `;

  await sendEmail(
    order.userEmail,
    order.billingAddress?.firstName || "",
    `Your Order #${order.number} Has Shipped`,
    html
  );

  res.sendStatus(200);
});

// Customer Created Webhook
app.post("/webhooks/customer-created", async (req, res) => {
  const { user } = req.body;
  
  const html = `
    <h1>Welcome to Our Store! 🛍️</h1>
    <p>Hi ${user.firstName || "there"},</p>
    <p>Thanks for creating an account with us.</p>
    <p>Start shopping and enjoy exclusive member benefits!</p>
    <p><a href="{{store_url}}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Start Shopping</a></p>
  `;

  await sendEmail(
    user.email,
    user.firstName || "",
    "Welcome to Our Store!",
    html
  );

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Saleor App running on port ${PORT}`));
```

### 2. Configure Webhooks

Register webhooks in Saleor Dashboard:

1. Go to **Apps** → **Custom Apps** → **Create App**
2. Add webhook endpoints:
   - `ORDER_CREATED` → `https://your-app.com/webhooks/order-created`
   - `ORDER_FULFILLED` → `https://your-app.com/webhooks/order-fulfilled`
   - `CUSTOMER_CREATED` → `https://your-app.com/webhooks/customer-created`

### 3. GraphQL Plugin (Alternative)

```python
# saleor/plugins/adsmedia/plugin.py
from saleor.plugins.base_plugin import BasePlugin
import requests

class ADSMediaPlugin(BasePlugin):
    PLUGIN_ID = "adsmedia.email"
    PLUGIN_NAME = "ADSMedia Email"
    
    DEFAULT_CONFIGURATION = [
        {"name": "api_key", "value": ""},
        {"name": "from_name", "value": "Your Store"},
    ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        configuration = {item["name"]: item["value"] for item in self.configuration}
        self.api_key = configuration.get("api_key")
        self.from_name = configuration.get("from_name")

    def send_email(self, to, to_name, subject, html):
        if not self.api_key:
            return
            
        requests.post(
            "https://api.adsmedia.live/v1/send",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "to": to,
                "to_name": to_name,
                "subject": subject,
                "html": html,
                "from_name": self.from_name,
            },
        )

    def order_confirmed(self, order, previous_value):
        self.send_email(
            order.user_email,
            order.billing_address.first_name if order.billing_address else "",
            f"Order Confirmed #{order.number}",
            f"<h1>Thank you for your order!</h1><p>Order #{order.number}</p>",
        )
        return previous_value
```

## Email Templates

### Order Confirmation

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #4F46E5; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
  </div>
  <div style="padding: 30px;">
    <p>Hi {{customer_name}},</p>
    <p>Thank you for your order <strong>#{{order_number}}</strong>.</p>
    {{order_items}}
    <p style="font-size: 18px;"><strong>Total: {{total}}</strong></p>
  </div>
</body>
</html>
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Saleor](https://saleor.io)
- [Saleor Docs](https://docs.saleor.io)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

