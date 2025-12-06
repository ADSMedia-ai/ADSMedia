# ADSMedia + Twenty CRM Integration

Send emails from Twenty CRM via ADSMedia.

## Overview

Twenty is an open-source CRM. This integration enables:
- Send emails to contacts directly from Twenty
- Automated email sequences
- Activity tracking

## Setup

### 1. Twenty Webhook to ADSMedia

```typescript
// twenty-adsmedia-webhook/src/index.ts
import express from 'express';

const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY!;

async function sendEmail(to: string, toName: string, subject: string, html: string) {
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
      from_name: 'Sales Team',
    }),
  });
  return response.json();
}

// Twenty webhook for new person created
app.post('/webhook/twenty/person-created', async (req, res) => {
  const { record } = req.body;
  
  // Send welcome email to new contact
  await sendEmail(
    record.email,
    `${record.firstName} ${record.lastName}`,
    'Thanks for connecting!',
    `
      <h1>Hi ${record.firstName}!</h1>
      <p>Thanks for getting in touch. We're excited to connect with you.</p>
      <p>Our team will reach out soon to discuss how we can help.</p>
      <p>Best regards,<br>The Sales Team</p>
    `
  );

  res.sendStatus(200);
});

// Twenty webhook for opportunity stage change
app.post('/webhook/twenty/opportunity-updated', async (req, res) => {
  const { record, previousRecord } = req.body;
  
  if (record.stage !== previousRecord?.stage) {
    const person = record.person;
    
    // Notify about stage change
    if (record.stage === 'WON') {
      await sendEmail(
        person.email,
        `${person.firstName} ${person.lastName}`,
        'Welcome Aboard! 🎉',
        `
          <h1>Welcome to the Family, ${person.firstName}!</h1>
          <p>We're thrilled to have you as a customer.</p>
          <p>Here's what happens next:</p>
          <ul>
            <li>Your account manager will reach out within 24 hours</li>
            <li>You'll receive access credentials</li>
            <li>We'll schedule an onboarding call</li>
          </ul>
        `
      );
    }
  }

  res.sendStatus(200);
});

app.listen(3000);
```

### 2. Twenty Custom Code Block

Use Twenty's workflow automation:

```javascript
// Twenty Workflow - Send Email Action
async function sendEmailViaADSMedia(person, subject, htmlTemplate) {
  const API_KEY = '{{ADSMEDIA_API_KEY}}';
  
  const html = htmlTemplate
    .replace('{{firstName}}', person.firstName)
    .replace('{{lastName}}', person.lastName)
    .replace('{{company}}', person.company?.name || '');

  const response = await fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: person.email,
      to_name: `${person.firstName} ${person.lastName}`,
      subject,
      html,
      from_name: 'Your Company',
    }),
  });

  return response.json();
}
```

### 3. Twenty GraphQL Integration

Query contacts and send emails:

```typescript
// Send campaign to all contacts
async function sendCampaignToContacts() {
  const TWENTY_API = 'https://api.twenty.com/graphql';
  const TWENTY_TOKEN = process.env.TWENTY_API_KEY;

  // Get all people with email
  const peopleResponse = await fetch(TWENTY_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TWENTY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          people(filter: { email: { isNot: null } }) {
            edges {
              node {
                id
                firstName
                lastName
                email
                company { name }
              }
            }
          }
        }
      `,
    }),
  });

  const { data } = await peopleResponse.json();
  const recipients = data.people.edges.map((e: any) => ({
    email: e.node.email,
    name: `${e.node.firstName} ${e.node.lastName}`,
  }));

  // Send batch via ADSMedia
  const response = await fetch('https://api.adsmedia.live/v1/send/batch', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipients,
      subject: 'Monthly Newsletter',
      html: '<h1>Newsletter</h1><p>Your monthly update...</p>',
      from_name: 'Newsletter',
    }),
  });

  return response.json();
}
```

## Use Cases

1. **Welcome Sequence** - Auto-email new contacts
2. **Deal Updates** - Notify on stage changes
3. **Mass Campaigns** - Send to all/filtered contacts
4. **Follow-ups** - Automated follow-up sequences

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Twenty CRM](https://twenty.com)
- [Twenty Docs](https://docs.twenty.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

