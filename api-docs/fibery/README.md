# ADSMedia + Fibery Integration

Send emails based on Fibery workspace events.

## Setup

### Fibery Automation + ADSMedia

```javascript
// Fibery Automation Script
const ADSMEDIA_API_KEY = 'your_api_key';

// This runs in Fibery automation
const entity = args.currentEntity;
const email = entity['Email'];
const name = entity['Name'];

if (email) {
  const response = await fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: email,
      to_name: name || '',
      subject: `Update on ${entity['Name']}`,
      html: `<h1>Status Update</h1><p>Your item has been updated.</p>`,
      from_name: 'Fibery Notifications',
    }),
  });
  
  return response.json();
}
```

### Webhook Handler

```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook/fibery', async (req, res) => {
  const { entity, event } = req.body;
  
  if (entity.Email && event === 'created') {
    await fetch('https://api.adsmedia.live/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ADSMEDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: entity.Email,
        to_name: entity.Name,
        subject: 'Welcome!',
        html: '<h1>Thanks for joining!</h1>',
        from_name: 'Team',
      }),
    });
  }
  
  res.sendStatus(200);
});

app.listen(3000);
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Fibery](https://fibery.io)

