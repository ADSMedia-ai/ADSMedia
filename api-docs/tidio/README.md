# ADSMedia + Tidio Integration

Send follow-up emails after Tidio chat conversations.

## Setup

### Tidio Webhook Handler

```javascript
const express = require('express');
const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

async function sendEmail(to, toName, subject, html) {
  return fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to, to_name: toName, subject, html,
      from_name: 'Support Team',
    }),
  });
}

app.post('/webhook/tidio', async (req, res) => {
  const { event, visitor, messages } = req.body;
  
  if (event === 'conversation.closed' && visitor?.email) {
    // Send chat transcript
    const transcript = messages.map(m => 
      `<p><strong>${m.sender === 'visitor' ? 'You' : 'Agent'}:</strong> ${m.content}</p>`
    ).join('');
    
    await sendEmail(
      visitor.email,
      visitor.name || '',
      'Your Chat Transcript',
      `
        <h1>Chat Summary</h1>
        <p>Thanks for chatting with us!</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          ${transcript}
        </div>
        <p>Feel free to reach out if you have more questions.</p>
      `
    );
  }
  
  if (event === 'form.submitted') {
    const { email, name, message } = req.body.form;
    await sendEmail(
      email,
      name,
      'We Got Your Message!',
      `<h1>Thanks!</h1><p>We'll get back to you soon.</p>`
    );
  }
  
  res.sendStatus(200);
});

app.listen(3000);
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Tidio](https://tidio.com)

