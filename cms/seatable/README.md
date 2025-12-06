# ADSMedia + SeaTable Integration

Send emails using data from SeaTable via ADSMedia.

## Overview

SeaTable is a collaborative database platform. This integration enables:
- Send emails based on table data
- Automated email triggers
- Mail merge from tables

## Setup

### 1. SeaTable Script

Create a script in SeaTable:

```javascript
// SeaTable Script: Send Emails via ADSMedia

const ADSMEDIA_API_KEY = 'your_api_key_here';
const FROM_NAME = 'Your Company';

// Send email via ADSMedia API
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
      from_name: FROM_NAME,
    }),
  });
  
  return response.json();
}

// Main function
async function main() {
  const table = base.getTableByName('Contacts');
  const view = base.getViewByName(table, 'To Email');
  
  // Get rows that haven't been emailed
  const rows = base.getRows(table, view);
  
  for (const row of rows) {
    const email = row['Email'];
    const name = row['Name'];
    const company = row['Company'] || '';
    
    if (!email) continue;
    
    // Build personalized email
    const html = `
      <h1>Hi ${name}!</h1>
      <p>Thank you for your interest in our services.</p>
      ${company ? `<p>We're excited to potentially work with ${company}.</p>` : ''}
      <p>Let's schedule a call to discuss your needs.</p>
      <p>
        <a href="https://calendly.com/your-link" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Schedule a Call
        </a>
      </p>
    `;
    
    const result = await sendEmail(email, name, 'Let\'s Connect!', html);
    
    if (result.success) {
      // Update row to mark as emailed
      base.modifyRow(table, row, {
        'Email Sent': true,
        'Email Sent Date': new Date().toISOString(),
        'Message ID': result.data.message_id,
      });
      
      output.text(`✅ Sent to ${email}`);
    } else {
      output.text(`❌ Failed for ${email}: ${result.error?.message}`);
    }
  }
  
  output.text('Done!');
}

main();
```

### 2. Automation Script (Button Column)

```javascript
// SeaTable Button Script: Send Single Email

const ADSMEDIA_API_KEY = 'your_api_key_here';

async function sendEmail(to, toName, subject, html) {
  const response = await fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, to_name: toName, subject, html, from_name: 'Sales' }),
  });
  return response.json();
}

// Get current row data
const row = context.currentRow;
const email = row['Email'];
const name = row['Name'];

if (!email) {
  output.text('No email address!');
  return;
}

// Get email template from another table
const templates = base.getTableByName('Email Templates');
const template = base.getRows(templates)[0]; // Get first template

const html = template['HTML Content']
  .replace('{{name}}', name)
  .replace('{{company}}', row['Company'] || '');

const result = await sendEmail(email, name, template['Subject'], html);

if (result.success) {
  // Log the email
  const logsTable = base.getTableByName('Email Logs');
  base.addRow(logsTable, {
    'Recipient': email,
    'Subject': template['Subject'],
    'Sent Date': new Date().toISOString(),
    'Message ID': result.data.message_id,
    'Contact': [row._id], // Link to contact
  });
  
  output.text(`Email sent to ${name}!`);
} else {
  output.text(`Error: ${result.error?.message}`);
}
```

### 3. Webhook Integration

Configure a webhook in SeaTable to trigger on row changes:

```javascript
// Webhook handler (Node.js/Express)
const express = require('express');
const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

app.post('/webhook/seatable', async (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'row.create' && data.table_name === 'Leads') {
    const row = data.row;
    
    // Send welcome email for new leads
    await fetch('https://api.adsmedia.live/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: row.Email,
        to_name: row.Name,
        subject: 'Thanks for reaching out!',
        html: `<h1>Hi ${row.Name}!</h1><p>We received your inquiry and will get back to you soon.</p>`,
        from_name: 'Sales Team',
      }),
    });
  }
  
  res.sendStatus(200);
});

app.listen(3000);
```

### 4. Mail Merge Script

```javascript
// SeaTable Script: Mail Merge Campaign

const ADSMEDIA_API_KEY = 'your_api_key_here';

async function sendBatch(recipients, subject, htmlTemplate) {
  // Personalize for each recipient
  const emails = recipients.map(r => ({
    to: r.email,
    to_name: r.name,
    subject: subject.replace('{{name}}', r.name),
    html: htmlTemplate
      .replace(/\{\{name\}\}/g, r.name)
      .replace(/\{\{company\}\}/g, r.company || '')
      .replace(/\{\{custom1\}\}/g, r.custom1 || ''),
    from_name: 'Marketing',
  }));

  // Send in batches of 50
  const batchSize = 50;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    for (const email of batch) {
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(email),
      });
    }
    
    output.text(`Sent batch ${Math.floor(i / batchSize) + 1}`);
  }
}

// Get contacts and template
const contacts = base.getTableByName('Contacts');
const rows = base.getRows(contacts);

const recipients = rows.map(r => ({
  email: r['Email'],
  name: r['Name'],
  company: r['Company'],
  custom1: r['Product Interest'],
}));

const htmlTemplate = `
<h1>Hi {{name}}!</h1>
<p>We noticed you're interested in {{custom1}}.</p>
<p>Here's a special offer just for you...</p>
`;

await sendBatch(recipients, 'Special Offer for {{name}}', htmlTemplate);
output.text('Campaign sent!');
```

## Table Structure

### Contacts Table
| Column | Type |
|--------|------|
| Name | Text |
| Email | Email |
| Company | Text |
| Email Sent | Checkbox |
| Email Sent Date | Date |
| Message ID | Text |

### Email Templates Table
| Column | Type |
|--------|------|
| Name | Text |
| Subject | Text |
| HTML Content | Long Text |

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [SeaTable](https://seatable.io)
- [SeaTable Scripting](https://seatable.io/docs/javascript-python/)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

