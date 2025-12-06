# ADSMedia + EasyPost Integration

Send shipping notifications with EasyPost tracking.

## Setup

### EasyPost Webhook Handler

```javascript
const express = require('express');
const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

async function sendEmail(to, toName, subject, html) {
  return fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to, to_name: toName, subject, html,
      from_name: 'Shipping Updates',
    }),
  });
}

app.post('/webhook/easypost', async (req, res) => {
  const { description, result } = req.body;
  const tracker = result;
  
  // Customer info stored in tracker metadata
  const customer = JSON.parse(tracker.metadata || '{}');
  if (!customer.email) return res.sendStatus(200);
  
  const status = tracker.status;
  let subject, content;
  
  switch (status) {
    case 'in_transit':
      subject = 'Your Package is On The Way! 📦';
      content = `
        <h1>Shipped!</h1>
        <p>Your package is on its way.</p>
        <p><strong>Tracking:</strong> ${tracker.tracking_code}</p>
        <p><strong>Carrier:</strong> ${tracker.carrier}</p>
        <p><a href="${tracker.public_url}">Track Package →</a></p>
      `;
      break;
      
    case 'out_for_delivery':
      subject = 'Out for Delivery Today! 🚚';
      content = `
        <h1>Arriving Today!</h1>
        <p>Your package is out for delivery.</p>
        <p><a href="${tracker.public_url}">Track Package →</a></p>
      `;
      break;
      
    case 'delivered':
      subject = 'Package Delivered! ✅';
      content = `
        <h1>Delivered!</h1>
        <p>Your package has been delivered.</p>
        <p>Enjoy your order!</p>
      `;
      break;
      
    case 'failure':
    case 'return_to_sender':
      subject = 'Delivery Issue ⚠️';
      content = `
        <h1>Delivery Problem</h1>
        <p>There was an issue with your delivery.</p>
        <p>Please contact us for assistance.</p>
      `;
      break;
      
    default:
      return res.sendStatus(200);
  }
  
  await sendEmail(customer.email, customer.name, subject, content);
  res.sendStatus(200);
});

app.listen(3000);
```

### Create Tracker with Metadata

```javascript
const EasyPost = require('@easypost/api');
const client = new EasyPost(process.env.EASYPOST_API_KEY);

async function createTrackerWithCustomer(trackingCode, carrier, customer) {
  const tracker = await client.Tracker.create({
    tracking_code: trackingCode,
    carrier: carrier,
    metadata: JSON.stringify({
      email: customer.email,
      name: customer.name,
      orderId: customer.orderId,
    }),
  });
  
  return tracker;
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [EasyPost](https://easypost.com)
- [EasyPost API](https://www.easypost.com/docs)

