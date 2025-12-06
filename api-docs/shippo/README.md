# ADSMedia + Shippo Integration

Send shipping notification emails with Shippo tracking.

## Setup

### 1. Shippo Webhook Handler

```javascript
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
      to, to_name: toName, subject, html,
      from_name: 'Shipping Updates',
    }),
  });
  return response.json();
}

app.post('/webhook/shippo', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'track_updated') {
    const tracking = data;
    const status = tracking.tracking_status;
    const customer = tracking.metadata; // Store customer info in metadata
    
    if (!customer?.email) {
      return res.sendStatus(200);
    }

    let subject, content;

    switch (status.status) {
      case 'TRANSIT':
        subject = 'Your Package is On Its Way! 📦';
        content = `
          <h1>Your Order Has Shipped!</h1>
          <p>Hi ${customer.name},</p>
          <p>Great news! Your package is on its way.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tracking Number:</strong> ${tracking.tracking_number}</p>
            <p><strong>Carrier:</strong> ${tracking.carrier}</p>
            <p><strong>Status:</strong> ${status.status_details}</p>
            <p><strong>Location:</strong> ${status.location?.city}, ${status.location?.state}</p>
          </div>
          <p><a href="${tracking.tracking_url_provider}" style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">Track Package</a></p>
        `;
        break;

      case 'DELIVERED':
        subject = 'Your Package Has Been Delivered! ✅';
        content = `
          <h1>Delivered!</h1>
          <p>Hi ${customer.name},</p>
          <p>Your package has been delivered.</p>
          <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Delivered:</strong> ${new Date(status.status_date).toLocaleString()}</p>
            <p><strong>Location:</strong> ${status.location?.city}, ${status.location?.state}</p>
          </div>
          <p>Enjoy your order!</p>
        `;
        break;

      case 'FAILURE':
        subject = 'Delivery Issue - Action Required';
        content = `
          <h1>Delivery Issue</h1>
          <p>Hi ${customer.name},</p>
          <p>There was an issue with your delivery:</p>
          <p style="color: #DC2626;">${status.status_details}</p>
          <p>Please contact us if you need assistance.</p>
        `;
        break;

      default:
        return res.sendStatus(200);
    }

    await sendEmail(customer.email, customer.name, subject, content);
  }

  res.sendStatus(200);
});

app.listen(3000);
```

### 2. Create Shipment with Metadata

```javascript
const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY;

async function createShipment(order) {
  const response = await fetch('https://api.goshippo.com/shipments/', {
    method: 'POST',
    headers: {
      'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address_from: {
        name: 'Your Store',
        street1: '123 Warehouse St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: 'US',
      },
      address_to: {
        name: order.customerName,
        street1: order.address.street,
        city: order.address.city,
        state: order.address.state,
        zip: order.address.zip,
        country: order.address.country,
      },
      parcels: [{
        length: '10',
        width: '8',
        height: '4',
        distance_unit: 'in',
        weight: '2',
        mass_unit: 'lb',
      }],
      metadata: JSON.stringify({
        email: order.customerEmail,
        name: order.customerName,
        orderId: order.id,
      }),
    }),
  });

  return response.json();
}
```

### 3. Register Tracking Webhook

```javascript
async function registerWebhook() {
  await fetch('https://api.goshippo.com/tracks/', {
    method: 'POST',
    headers: {
      'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      carrier: 'usps',
      tracking_number: 'TRACKING_NUMBER',
      metadata: JSON.stringify({
        email: 'customer@example.com',
        name: 'John Doe',
      }),
    }),
  });
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Shippo](https://goshippo.com)
- [Shippo API](https://goshippo.com/docs)

