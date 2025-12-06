# ADSMedia Crisp Integration

Send emails from Crisp chatbot conversations using ADSMedia API.

## Overview

This integration allows you to send emails from Crisp chat triggers, automations, and custom plugins.

## Setup Methods

### Method 1: Crisp Automation (Webhooks)

1. Go to **Crisp** → **Settings** → **Automations**
2. Create new automation
3. Add webhook action pointing to your backend

### Method 2: Crisp Plugin (JavaScript)

1. Go to **Crisp** → **Plugins** → **Custom Scripts**
2. Add custom script for email functionality

## Webhook Integration

### Create Backend Endpoint

Deploy a simple webhook handler:

```javascript
// webhook-handler.js (Node.js/Express)
const express = require('express');
const app = express();

app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

app.post('/crisp-webhook', async (req, res) => {
  const { event, data } = req.body;
  
  // Verify Crisp signature (recommended)
  const signature = req.headers['x-crisp-signature'];
  
  if (event === 'message:send' && data.content?.text?.includes('/email')) {
    // Parse email command from chat
    const match = data.content.text.match(/\/email\s+(\S+)\s+(.+)/);
    
    if (match) {
      const [, email, message] = match;
      
      try {
        const response = await fetch('https://api.adsmedia.live/v1/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email,
            subject: 'Message from Chat',
            html: `<p>${message}</p>`,
            from_name: 'Crisp Support',
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Optionally send confirmation back to Crisp
          await sendCrispMessage(data.session_id, `Email sent to ${email}!`);
        }
      } catch (error) {
        console.error('Email send failed:', error);
      }
    }
  }
  
  res.sendStatus(200);
});

async function sendCrispMessage(sessionId, text) {
  // Use Crisp REST API to send message back
  await fetch(`https://api.crisp.chat/v1/website/${WEBSITE_ID}/conversation/${sessionId}/message`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${CRISP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'text',
      from: 'operator',
      origin: 'chat',
      content: text,
    }),
  });
}

app.listen(3000);
```

### Configure Crisp Webhook

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/crisp-webhook`
3. Select events: `message:send`

## Crisp Automation Example

### Send Email on Conversation End

```yaml
Trigger: Conversation resolved
Conditions:
  - Has email address
  - Rating given

Actions:
  1. HTTP Request:
     Method: POST
     URL: https://api.adsmedia.live/v1/send
     Headers:
       Authorization: Bearer YOUR_API_KEY
       Content-Type: application/json
     Body:
       {
         "to": "{{email}}",
         "subject": "Thank you for chatting with us!",
         "html": "<h1>Thanks for your feedback!</h1><p>You rated our support {{rating}} stars.</p>",
         "from_name": "Support Team"
       }
```

### Send Transcript

```yaml
Trigger: Conversation resolved
Conditions:
  - Request transcript

Actions:
  1. HTTP Request:
     URL: https://api.adsmedia.live/v1/send
     Body:
       {
         "to": "{{email}}",
         "subject": "Your Chat Transcript",
         "html": "<h1>Chat Transcript</h1>{{transcript_html}}",
         "from_name": "Support"
       }
```

## Custom Crisp Plugin

### Plugin Script

```javascript
// crisp-adsmedia-plugin.js
(function() {
  const ADSMEDIA_API_KEY = 'YOUR_API_KEY'; // Better: use backend proxy
  
  // Add custom command handler
  window.$crisp.push(['on', 'chat:message:received', function(message) {
    if (message.content.startsWith('/email')) {
      handleEmailCommand(message);
    }
  }]);
  
  async function handleEmailCommand(message) {
    const parts = message.content.split(' ');
    if (parts.length < 3) {
      sendSystemMessage('Usage: /email recipient@example.com Your message here');
      return;
    }
    
    const email = parts[1];
    const content = parts.slice(2).join(' ');
    
    sendSystemMessage('Sending email...');
    
    // Note: In production, route through your backend for security
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, content }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        sendSystemMessage(`Email sent to ${email}!`);
      } else {
        sendSystemMessage('Failed to send email. Please try again.');
      }
    } catch (error) {
      sendSystemMessage('Error sending email.');
    }
  }
  
  function sendSystemMessage(text) {
    window.$crisp.push(['do', 'message:show', ['text', text]]);
  }
})();
```

## Use Cases

### 1. Follow-up Email After Chat

When chat ends, send summary email to customer with:
- Chat transcript
- Support ticket number
- Links to resources
- Feedback request

### 2. Lead Capture

When visitor provides email in chat:
- Send welcome/introduction email
- Attach relevant materials
- Schedule follow-up

### 3. Ticket Creation

When issue requires ticket:
- Create support ticket
- Email confirmation to customer
- Include ticket ID and status link

### 4. Appointment Booking

When booking is made in chat:
- Send confirmation email
- Include calendar invite
- Reminder setup

## Integration with Crisp CRM

### Sync Email Activity

```javascript
// After sending email via ADSMedia
async function logEmailToCrisp(sessionId, emailDetails) {
  await fetch(`https://api.crisp.chat/v1/website/${WEBSITE_ID}/conversation/${sessionId}/note`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${CRISP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: `Email sent: ${emailDetails.subject} → ${emailDetails.to}`,
    }),
  });
}
```

## Security Best Practices

1. **Never expose API key in client code** - Use backend proxy
2. **Verify Crisp webhooks** - Check signature header
3. **Validate email addresses** - Prevent abuse
4. **Rate limit** - Prevent spam
5. **Log all actions** - For audit trail

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Crisp](https://crisp.chat)
- [Crisp Developers](https://developers.crisp.chat)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

