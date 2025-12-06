# ADSMedia + Beehiiv Integration

Integrate ADSMedia email sending with Beehiiv newsletter platform.

## Overview

Combine Beehiiv's newsletter tools with ADSMedia's delivery for:
- Transactional emails (welcome, confirmations)
- High-volume newsletter delivery
- Custom email templates

## Setup

### 1. Beehiiv Webhook to ADSMedia

Handle Beehiiv subscription events:

```javascript
// beehiiv-webhook-handler.js
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;
const BEEHIIV_WEBHOOK_SECRET = process.env.BEEHIIV_WEBHOOK_SECRET;

// Verify Beehiiv webhook signature
function verifySignature(req) {
  const signature = req.headers['x-beehiiv-signature'];
  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', BEEHIIV_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return signature === expected;
}

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
      from_name: 'Newsletter',
    }),
  });
  return response.json();
}

app.post('/webhook/beehiiv', async (req, res) => {
  // Verify signature in production
  // if (!verifySignature(req)) return res.status(401).send('Invalid signature');
  
  const { type, data } = req.body;
  
  switch (type) {
    case 'subscription.created':
      // New subscriber - send welcome email
      await sendEmail(
        data.email,
        data.first_name || 'Subscriber',
        'Welcome to Our Newsletter!',
        `
          <h1>Welcome! 🎉</h1>
          <p>Hi ${data.first_name || 'there'},</p>
          <p>Thanks for subscribing to our newsletter.</p>
          <p>You'll receive our best content directly in your inbox.</p>
          <p>Stay tuned!</p>
        `
      );
      break;
      
    case 'subscription.upgraded':
      // Premium upgrade
      await sendEmail(
        data.email,
        data.first_name,
        'Welcome to Premium!',
        `
          <h1>You're Premium Now! ⭐</h1>
          <p>Thank you for upgrading to our premium newsletter.</p>
          <p>Enjoy exclusive content and early access.</p>
        `
      );
      break;
      
    case 'subscription.cancelled':
      // Cancellation
      await sendEmail(
        data.email,
        data.first_name,
        "We'll Miss You!",
        `
          <h1>Sorry to See You Go</h1>
          <p>Your subscription has been cancelled.</p>
          <p>You're always welcome back!</p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

app.listen(3000);
```

### 2. Configure Beehiiv Webhook

1. Go to **Settings** → **Integrations** → **Webhooks** in Beehiiv
2. Add endpoint URL
3. Select subscription events

### 3. Beehiiv API Integration

Sync subscribers and send via ADSMedia:

```javascript
const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY;
const BEEHIIV_PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID;

// Get all subscribers from Beehiiv
async function getBeehiivSubscribers() {
  const response = await fetch(
    `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`,
    {
      headers: {
        'Authorization': `Bearer ${BEEHIIV_API_KEY}`,
      },
    }
  );
  return response.json();
}

// Send newsletter via ADSMedia
async function sendNewsletterViaADSMedia(subject, html) {
  const subscribers = await getBeehiivSubscribers();
  
  const recipients = subscribers.data.map(sub => ({
    email: sub.email,
    name: sub.first_name || '',
  }));
  
  // Send batch via ADSMedia
  const response = await fetch('https://api.adsmedia.live/v1/send/batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipients,
      subject,
      html,
      from_name: 'Newsletter',
    }),
  });
  
  return response.json();
}
```

## Use Cases

### 1. Welcome Sequence

Send immediate welcome via ADSMedia while Beehiiv handles the drip sequence.

### 2. Transactional Emails

Use ADSMedia for:
- Double opt-in confirmations
- Payment receipts
- Account notifications

### 3. High-Volume Sends

For large subscriber lists, use ADSMedia's batch API.

### 4. A/B Testing Delivery

Compare deliverability between Beehiiv and ADSMedia.

## Email Templates

### Welcome Email

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
    <h1 style="color: white;">Welcome to {{newsletter_name}}! 🎉</h1>
  </div>
  <div style="padding: 30px;">
    <p>Hi {{first_name}},</p>
    <p>Thanks for subscribing! Here's what to expect:</p>
    <ul>
      <li>Weekly insights delivered every {{day}}</li>
      <li>Exclusive content for subscribers</li>
      <li>Early access to new releases</li>
    </ul>
    <p style="text-align: center;">
      <a href="{{archive_link}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px;">Read Past Issues</a>
    </p>
  </div>
</body>
</html>
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Beehiiv](https://www.beehiiv.com)
- [Beehiiv API](https://developers.beehiiv.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

