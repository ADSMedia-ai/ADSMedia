# ADSMedia + Folk Integration

Send emails to contacts from Folk CRM.

## Setup

### 1. Folk API + ADSMedia

```javascript
const FOLK_API_KEY = process.env.FOLK_API_KEY;
const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

async function getFolkContacts(groupId) {
  const response = await fetch(`https://api.folk.app/v1/groups/${groupId}/people`, {
    headers: {
      'Authorization': `Bearer ${FOLK_API_KEY}`,
    },
  });
  return response.json();
}

async function sendEmailToGroup(groupId, subject, htmlTemplate) {
  const contacts = await getFolkContacts(groupId);

  for (const contact of contacts.data) {
    const email = contact.emails?.[0];
    const name = contact.firstName || contact.fullName;

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
          subject: subject.replace('{{name}}', name),
          html: htmlTemplate
            .replace(/\{\{name\}\}/g, name)
            .replace(/\{\{company\}\}/g, contact.companies?.[0]?.name || ''),
          from_name: 'Your Team',
        }),
      });
    }
  }
}

// Send to all contacts in a Folk group
await sendEmailToGroup(
  'group_xyz789',
  'Hello {{name}}!',
  '<h1>Hi {{name}} from {{company}}!</h1><p>Checking in...</p>'
);
```

### 2. Webhook Handler

```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook/folk', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'person.created') {
    const person = data;
    const email = person.emails?.[0];
    
    if (email) {
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          to_name: person.firstName,
          subject: 'Nice to meet you!',
          html: `<h1>Hi ${person.firstName}!</h1><p>Thanks for connecting.</p>`,
          from_name: 'Team',
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
- [Folk](https://folk.app)

