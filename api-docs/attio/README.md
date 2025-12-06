# ADSMedia + Attio Integration

Send emails to contacts from Attio CRM.

## Setup

### 1. Attio Webhook Handler

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
      from_name: 'Sales Team',
    }),
  });
  return response.json();
}

// Attio webhook for record changes
app.post('/webhook/attio', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'record.created' && data.object === 'people') {
    const person = data.record;
    const email = person.values.email?.[0]?.email;
    const name = person.values.name?.[0]?.full_name;

    if (email) {
      await sendEmail(
        email,
        name,
        'Welcome!',
        `
          <h1>Hi ${name}!</h1>
          <p>Thanks for connecting with us.</p>
          <p>We're excited to learn more about how we can help you.</p>
        `
      );
    }
  }

  if (event === 'record.updated' && data.object === 'deals') {
    const deal = data.record;
    const stage = deal.values.stage?.[0]?.option?.title;
    
    if (stage === 'Won') {
      // Get associated person
      const person = deal.values.contact?.[0]?.target_record;
      if (person) {
        await sendEmail(
          person.values.email?.[0]?.email,
          person.values.name?.[0]?.full_name,
          'Welcome Aboard! 🎉',
          `
            <h1>Congratulations!</h1>
            <p>Welcome to our customer family.</p>
            <p>Your account manager will reach out shortly.</p>
          `
        );
      }
    }
  }

  res.sendStatus(200);
});

app.listen(3000);
```

### 2. Attio API Integration

Query contacts and send campaigns:

```javascript
const ATTIO_API_KEY = process.env.ATTIO_API_KEY;

async function getAttioContacts(listId) {
  const response = await fetch(`https://api.attio.com/v2/lists/${listId}/entries`, {
    headers: {
      'Authorization': `Bearer ${ATTIO_API_KEY}`,
    },
  });
  return response.json();
}

async function sendCampaignToList(listId, subject, html) {
  const { data: entries } = await getAttioContacts(listId);

  for (const entry of entries) {
    const record = entry.record;
    const email = record.values.email?.[0]?.email;
    const name = record.values.name?.[0]?.full_name;

    if (email) {
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          to_name: name,
          subject,
          html: html.replace('{{name}}', name),
          from_name: 'Marketing',
        }),
      });
    }
  }
}

// Usage
await sendCampaignToList(
  'list_abc123',
  'Monthly Newsletter',
  '<h1>Hi {{name}}!</h1><p>Here is your monthly update...</p>'
);
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Attio](https://attio.com)
- [Attio API](https://developers.attio.com)

