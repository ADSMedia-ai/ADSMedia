# ADSMedia + Drip Integration

Integrate ADSMedia email sending with Drip marketing automation.

## Overview

Combine Drip's powerful automation with ADSMedia's email delivery for:
- Send transactional emails triggered by Drip workflows
- Sync email events back to Drip
- Use ADSMedia for high-volume sends

## Setup

### 1. Drip Webhook to ADSMedia

Configure Drip to send webhook when subscriber performs action:

```javascript
// webhook-handler.js
const express = require('express');
const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

async function sendEmail(to, toName, subject, html) {
  const response = await fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      to_name: toName,
      subject,
      html,
      from_name: 'Your Brand',
    }),
  });
  return response.json();
}

// Drip webhook endpoint
app.post('/webhook/drip', async (req, res) => {
  const { event, data } = req.body;
  const subscriber = data.subscriber;
  
  switch (event) {
    case 'subscriber.subscribed_to_campaign':
      await sendEmail(
        subscriber.email,
        subscriber.first_name,
        'Welcome to Our Campaign!',
        `
          <h1>Welcome, ${subscriber.first_name}!</h1>
          <p>You've been added to our ${data.properties.campaign_name} campaign.</p>
        `
      );
      break;
      
    case 'subscriber.performed_custom_event':
      if (data.properties.action === 'purchased') {
        await sendEmail(
          subscriber.email,
          subscriber.first_name,
          'Thank You for Your Purchase!',
          `
            <h1>Order Confirmed!</h1>
            <p>Hi ${subscriber.first_name}, your order is being processed.</p>
          `
        );
      }
      break;
      
    case 'subscriber.applied_tag':
      if (data.properties.tag === 'vip') {
        await sendEmail(
          subscriber.email,
          subscriber.first_name,
          'Welcome to VIP Status!',
          `
            <h1>You're a VIP Now!</h1>
            <p>Enjoy exclusive benefits and early access.</p>
          `
        );
      }
      break;
  }
  
  res.sendStatus(200);
});

app.listen(3000);
```

### 2. Configure Drip Webhook

1. Go to **Settings** → **Webhooks** in Drip
2. Add webhook URL: `https://your-domain.com/webhook/drip`
3. Select events to trigger

### 3. Drip API Integration

Use Drip API to sync ADSMedia events back:

```javascript
const DRIP_API_KEY = process.env.DRIP_API_KEY;
const DRIP_ACCOUNT_ID = process.env.DRIP_ACCOUNT_ID;

// Record email event in Drip
async function recordDripEvent(email, action, properties = {}) {
  await fetch(`https://api.getdrip.com/v2/${DRIP_ACCOUNT_ID}/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(DRIP_API_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      events: [{
        email,
        action,
        properties,
        occurred_at: new Date().toISOString(),
      }],
    }),
  });
}

// After sending via ADSMedia
const result = await sendEmail(email, name, subject, html);
if (result.success) {
  await recordDripEvent(email, 'Email sent via ADSMedia', {
    message_id: result.data.message_id,
    subject: subject,
  });
}
```

## Drip Automation Rules

### Trigger ADSMedia on Tag

```yaml
Rule: Send Welcome via ADSMedia
Trigger: Subscriber is tagged with "welcome-email"
Action: POST webhook to your handler
```

### Trigger on Custom Event

```yaml
Rule: Order Confirmation
Trigger: Subscriber performs "Placed order"
Action: POST webhook with order data
```

## Use Cases

1. **High-Volume Transactional** - Use ADSMedia for order confirmations, receipts
2. **Deliverability Split** - A/B test ADSMedia vs Drip delivery
3. **Backup Sending** - Fallback to ADSMedia if Drip quota exceeded
4. **Custom Templates** - Use ADSMedia for complex HTML emails

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Drip](https://www.drip.com)
- [Drip API](https://developer.drip.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

