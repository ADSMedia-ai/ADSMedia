# ADSMedia + ProductBoard Integration

Send emails when features are released.

## Setup

### ProductBoard Webhook Handler

```javascript
const express = require('express');
const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

app.post('/webhook/productboard', async (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'feature.status_changed' && data.status === 'Released') {
    const feature = data;
    
    // Get all users who requested this feature (from your database)
    const requesters = await getFeatureRequesters(feature.id);
    
    for (const user of requesters) {
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.email,
          to_name: user.name,
          subject: `Feature Shipped: ${feature.name} 🚀`,
          html: `
            <h1>Great News, ${user.name}!</h1>
            <p>The feature you requested is now live:</p>
            <h2>${feature.name}</h2>
            <p>${feature.description}</p>
            <p><a href="${feature.url}">Check it out →</a></p>
          `,
          from_name: 'Product Team',
        }),
      });
    }
  }
  
  res.sendStatus(200);
});

app.listen(3000);
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [ProductBoard](https://productboard.com)

