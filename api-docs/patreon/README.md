# ADSMedia + Patreon Integration

Send emails to patrons based on Patreon events.

## Setup

### 1. Patreon Webhook Handler

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;
const PATREON_WEBHOOK_SECRET = process.env.PATREON_WEBHOOK_SECRET;

function verifySignature(req) {
  const signature = req.headers['x-patreon-signature'];
  const hash = crypto
    .createHmac('md5', PATREON_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  return signature === hash;
}

async function sendEmail(to, toName, subject, html) {
  const response = await fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to, to_name: toName, subject, html,
      from_name: 'Your Patreon',
    }),
  });
  return response.json();
}

app.post('/webhook/patreon', async (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  const { data, included } = req.body;
  const trigger = req.headers['x-patreon-event'];
  
  // Find user in included data
  const user = included?.find(i => i.type === 'user');
  const email = user?.attributes?.email;
  const name = user?.attributes?.full_name;

  if (!email) {
    return res.sendStatus(200);
  }

  switch (trigger) {
    case 'members:create':
      await sendEmail(
        email,
        name,
        'Welcome to the Community! 🎉',
        `
          <h1>Welcome, ${name}!</h1>
          <p>Thank you for becoming a patron!</p>
          <p>Your support means the world to us.</p>
          <h2>What's Next?</h2>
          <ul>
            <li>Access your exclusive content</li>
            <li>Join our Discord community</li>
            <li>Check out patron-only posts</li>
          </ul>
        `
      );
      break;

    case 'members:pledge:create':
      const tier = included?.find(i => i.type === 'tier');
      await sendEmail(
        email,
        name,
        'Thank You for Your Pledge! 💖',
        `
          <h1>Thank You, ${name}!</h1>
          <p>Your pledge to the <strong>${tier?.attributes?.title || 'tier'}</strong> means everything.</p>
          <p>You now have access to all benefits at this tier level.</p>
        `
      );
      break;

    case 'members:pledge:update':
      await sendEmail(
        email,
        name,
        'Pledge Updated',
        `
          <h1>Pledge Updated</h1>
          <p>Hi ${name}, your pledge has been updated.</p>
          <p>Thank you for your continued support!</p>
        `
      );
      break;

    case 'members:pledge:delete':
      await sendEmail(
        email,
        name,
        "We'll Miss You!",
        `
          <h1>Sorry to See You Go</h1>
          <p>Hi ${name}, we noticed you've cancelled your pledge.</p>
          <p>We hope you enjoyed being part of our community.</p>
          <p>You're always welcome back!</p>
        `
      );
      break;
  }

  res.sendStatus(200);
});

app.listen(3000);
```

### 2. Configure Patreon Webhook

1. Go to **My Creators** → **Webhooks**
2. Add webhook URL
3. Select events: `members:create`, `members:pledge:create`, etc.

### 3. Patreon API Integration

Send to all patrons:

```javascript
const PATREON_ACCESS_TOKEN = process.env.PATREON_ACCESS_TOKEN;
const CAMPAIGN_ID = process.env.PATREON_CAMPAIGN_ID;

async function getPatrons() {
  const response = await fetch(
    `https://www.patreon.com/api/oauth2/v2/campaigns/${CAMPAIGN_ID}/members?include=user&fields[member]=email,full_name,patron_status&fields[user]=email,full_name`,
    {
      headers: {
        'Authorization': `Bearer ${PATREON_ACCESS_TOKEN}`,
      },
    }
  );
  return response.json();
}

async function sendPatronNewsletter(subject, html) {
  const { data, included } = await getPatrons();
  
  for (const member of data) {
    if (member.attributes.patron_status !== 'active_patron') continue;
    
    const userId = member.relationships.user.data.id;
    const user = included.find(i => i.id === userId && i.type === 'user');
    
    if (user?.attributes?.email) {
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.attributes.email,
          to_name: user.attributes.full_name,
          subject,
          html,
          from_name: 'Your Creator',
        }),
      });
    }
  }
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Patreon](https://patreon.com)
- [Patreon API](https://docs.patreon.com)

