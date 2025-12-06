# ADSMedia + Close CRM Integration

Send emails to leads from Close CRM.

## Setup

### 1. Close Webhook Handler

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

app.post('/webhook/close', async (req, res) => {
  const { event, data } = req.body;

  switch (event.type) {
    case 'lead.created':
      const lead = data;
      const contact = lead.contacts?.[0];
      
      if (contact?.emails?.[0]?.email) {
        await sendEmail(
          contact.emails[0].email,
          contact.name,
          'Thanks for Reaching Out!',
          `
            <h1>Hi ${contact.name}!</h1>
            <p>Thanks for getting in touch.</p>
            <p>A member of our team will follow up shortly.</p>
          `
        );
      }
      break;

    case 'opportunity.status_changed':
      if (data.new_status_label === 'Won') {
        const opportunity = data;
        const leadContact = opportunity.lead?.contacts?.[0];
        
        if (leadContact?.emails?.[0]?.email) {
          await sendEmail(
            leadContact.emails[0].email,
            leadContact.name,
            'Welcome Aboard! 🎉',
            `
              <h1>Welcome to the Family!</h1>
              <p>We're thrilled to have you as a customer.</p>
              <p>Here's what happens next...</p>
            `
          );
        }
      }
      break;
  }

  res.sendStatus(200);
});

app.listen(3000);
```

### 2. Close API Integration

```javascript
const CLOSE_API_KEY = process.env.CLOSE_API_KEY;

async function getCloseLeads(query) {
  const response = await fetch(
    `https://api.close.com/api/v1/lead/?query=${encodeURIComponent(query)}`,
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(CLOSE_API_KEY + ':').toString('base64')}`,
      },
    }
  );
  return response.json();
}

async function sendCampaignToLeads(smartViewQuery, subject, html) {
  const { data: leads } = await getCloseLeads(smartViewQuery);
  
  for (const lead of leads) {
    const contact = lead.contacts?.[0];
    const email = contact?.emails?.[0]?.email;
    
    if (email) {
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          to_name: contact.name,
          subject,
          html: html.replace('{{company}}', lead.display_name),
          from_name: 'Sales',
        }),
      });
    }
  }
}

// Send to all leads in "Hot Leads" smart view
await sendCampaignToLeads(
  'status:"Hot Lead"',
  'Special Offer for {{company}}',
  '<h1>Hi!</h1><p>We have a special offer for {{company}}.</p>'
);
```

### 3. Bulk Email from Smart View

```javascript
async function emailFromSmartView(smartViewId, subject, htmlTemplate) {
  const response = await fetch(
    `https://api.close.com/api/v1/saved_search/${smartViewId}/`,
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(CLOSE_API_KEY + ':').toString('base64')}`,
      },
    }
  );
  
  const smartView = await response.json();
  const { data: leads } = await getCloseLeads(smartView.query);
  
  let sent = 0;
  for (const lead of leads) {
    const contact = lead.contacts?.[0];
    if (contact?.emails?.[0]?.email) {
      const html = htmlTemplate
        .replace('{{name}}', contact.name || 'there')
        .replace('{{company}}', lead.display_name || '');
      
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: contact.emails[0].email,
          to_name: contact.name,
          subject,
          html,
          from_name: 'Sales',
        }),
      });
      sent++;
    }
  }
  
  return { sent, total: leads.length };
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Close](https://close.com)
- [Close API](https://developer.close.com)

