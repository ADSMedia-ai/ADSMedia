# ADSMedia Form Webhooks Integration

Handle form submissions from various platforms and send emails via ADSMedia.

## Supported Platforms

- Tally
- Fillout
- Typeform
- Jotform
- Formspree
- Reform
- Basin
- Paperform
- Cognito Forms
- 123FormBuilder
- Wufoo

## Universal Webhook Handler

```javascript
// form-webhook-handler.js
const express = require('express');
const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

// Generic send email function
async function sendEmail(to, toName, subject, html, fromName = 'Form Notification') {
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
      from_name: fromName,
    }),
  });
  return response.json();
}

// Build HTML from form data
function buildFormHtml(formName, fields) {
  let html = `<h1>New ${formName} Submission</h1>`;
  html += '<table style="border-collapse: collapse; width: 100%;">';
  
  for (const [key, value] of Object.entries(fields)) {
    html += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${key}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${value || 'N/A'}</td>
      </tr>
    `;
  }
  
  html += '</table>';
  return html;
}

// --- TALLY ---
app.post('/webhook/tally', async (req, res) => {
  const { eventId, eventType, data } = req.body;
  
  if (eventType !== 'FORM_RESPONSE') {
    return res.sendStatus(200);
  }
  
  const fields = {};
  data.fields.forEach(field => {
    fields[field.label] = field.value;
  });
  
  const email = fields['Email'] || fields['email'];
  const name = fields['Name'] || fields['name'] || 'Respondent';
  
  // Send to admin
  await sendEmail(
    process.env.ADMIN_EMAIL,
    'Admin',
    `New Tally Form: ${data.formName}`,
    buildFormHtml(data.formName, fields)
  );
  
  // Send confirmation to user
  if (email) {
    await sendEmail(
      email,
      name,
      'Thanks for your submission!',
      '<h1>Thank you!</h1><p>We received your form submission and will get back to you soon.</p>'
    );
  }
  
  res.sendStatus(200);
});

// --- FILLOUT ---
app.post('/webhook/fillout', async (req, res) => {
  const { submission, form } = req.body;
  
  const fields = {};
  submission.questions.forEach(q => {
    fields[q.name] = q.value;
  });
  
  const email = fields['email'] || fields['Email'];
  const name = fields['name'] || fields['Name'] || 'Respondent';
  
  await sendEmail(
    process.env.ADMIN_EMAIL,
    'Admin',
    `New Fillout Form: ${form.name}`,
    buildFormHtml(form.name, fields)
  );
  
  if (email) {
    await sendEmail(email, name, 'Thanks for your submission!',
      '<h1>Thank you!</h1><p>Your submission has been received.</p>');
  }
  
  res.sendStatus(200);
});

// --- TYPEFORM ---
app.post('/webhook/typeform', async (req, res) => {
  const { form_response, event_type } = req.body;
  
  if (event_type !== 'form_response') {
    return res.sendStatus(200);
  }
  
  const fields = {};
  const answers = form_response.answers || [];
  const definition = form_response.definition;
  
  answers.forEach(answer => {
    const field = definition.fields.find(f => f.id === answer.field.id);
    const label = field?.title || answer.field.id;
    
    let value;
    switch (answer.type) {
      case 'text':
      case 'email':
        value = answer[answer.type];
        break;
      case 'choice':
        value = answer.choice.label;
        break;
      case 'choices':
        value = answer.choices.labels.join(', ');
        break;
      case 'number':
        value = answer.number;
        break;
      default:
        value = JSON.stringify(answer[answer.type]);
    }
    
    fields[label] = value;
  });
  
  const email = form_response.answers.find(a => a.type === 'email')?.email;
  
  await sendEmail(
    process.env.ADMIN_EMAIL,
    'Admin',
    `New Typeform: ${definition.title}`,
    buildFormHtml(definition.title, fields)
  );
  
  if (email) {
    await sendEmail(email, 'Respondent', 'Thank you for your response!',
      '<h1>Thank you!</h1><p>We appreciate your submission.</p>');
  }
  
  res.sendStatus(200);
});

// --- JOTFORM ---
app.post('/webhook/jotform', async (req, res) => {
  const { rawRequest, formID, formTitle } = req.body;
  
  // Parse Jotform data
  const formData = JSON.parse(rawRequest || '{}');
  const fields = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (key.startsWith('q') && value) {
      fields[key] = typeof value === 'object' ? Object.values(value).join(' ') : value;
    }
  }
  
  await sendEmail(
    process.env.ADMIN_EMAIL,
    'Admin',
    `New Jotform: ${formTitle}`,
    buildFormHtml(formTitle, fields)
  );
  
  res.sendStatus(200);
});

// --- FORMSPREE ---
app.post('/webhook/formspree', async (req, res) => {
  const { _replyto, email, name, ...fields } = req.body;
  const recipientEmail = _replyto || email;
  
  await sendEmail(
    process.env.ADMIN_EMAIL,
    'Admin',
    'New Formspree Submission',
    buildFormHtml('Contact Form', { email: recipientEmail, name, ...fields })
  );
  
  if (recipientEmail) {
    await sendEmail(recipientEmail, name || 'User', 'Thank you!',
      '<h1>Thanks!</h1><p>We received your message.</p>');
  }
  
  res.sendStatus(200);
});

// --- GENERIC WEBHOOK ---
app.post('/webhook/generic', async (req, res) => {
  const { formName, adminEmail, fields, userEmail, userName, confirmationSubject, confirmationBody } = req.body;
  
  // Send to admin
  await sendEmail(
    adminEmail || process.env.ADMIN_EMAIL,
    'Admin',
    `New Submission: ${formName || 'Form'}`,
    buildFormHtml(formName || 'Form', fields)
  );
  
  // Send confirmation to user
  if (userEmail) {
    await sendEmail(
      userEmail,
      userName || 'User',
      confirmationSubject || 'Thanks for your submission!',
      confirmationBody || '<h1>Thank you!</h1><p>Your submission has been received.</p>'
    );
  }
  
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Form webhook handler running on port ${PORT}`));
```

## Platform-Specific Setup

### Tally

1. Go to form → **Integrations** → **Webhooks**
2. Add URL: `https://your-domain.com/webhook/tally`
3. Events: Form Response

### Fillout

1. Go to form → **Integrations** → **Webhooks**
2. Add URL: `https://your-domain.com/webhook/fillout`

### Typeform

1. Go to form → **Connect** → **Webhooks**
2. Add URL: `https://your-domain.com/webhook/typeform`

### Jotform

1. Go to form → **Settings** → **Integrations** → **WebHooks**
2. Add URL: `https://your-domain.com/webhook/jotform`

### Formspree

1. Go to form → **Settings** → **Submission Webhooks**
2. Add URL: `https://your-domain.com/webhook/formspree`

## Email Templates

### Admin Notification

```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h1 style="color: #333;">🔔 New Form Submission</h1>
  <p style="color: #666;">You have a new submission from <strong>{{formName}}</strong></p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
    {{fields_table}}
  </div>
  
  <p style="color: #999; font-size: 12px; margin-top: 20px;">
    Received: {{timestamp}}
  </p>
</div>
```

### User Confirmation

```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h1 style="color: #4F46E5;">✅ Thank You!</h1>
  <p>Hi {{name}},</p>
  <p>We've received your submission and will get back to you shortly.</p>
  
  <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>What happens next?</strong></p>
    <p style="margin: 5px 0 0 0;">Our team will review your submission and contact you within 24 hours.</p>
  </div>
  
  <p>Best regards,<br>The Team</p>
</div>
```

## Deployment

### Vercel

```javascript
// api/webhook/[platform].js
export default async function handler(req, res) {
  const { platform } = req.query;
  // Handle based on platform
}
```

### Railway/Render

Deploy the Express app directly.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "form-webhook-handler.js"]
```

## Best Practices

1. **Verify webhooks** where possible
2. **Log all submissions** for debugging
3. **Handle failures gracefully**
4. **Rate limit** to prevent abuse
5. **Validate email addresses** before sending

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

