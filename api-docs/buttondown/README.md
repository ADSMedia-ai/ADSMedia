# ADSMedia + Buttondown Integration

Combine Buttondown newsletter with ADSMedia for transactional emails.

## Setup

### 1. Buttondown Webhook Handler

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
      from_name: 'Newsletter',
    }),
  });
  return response.json();
}

app.post('/webhook/buttondown', async (req, res) => {
  const { event, data } = req.body;

  switch (event) {
    case 'subscriber.created':
      // Welcome email for new subscriber
      await sendEmail(
        data.email,
        data.metadata?.name || '',
        'Welcome to Our Newsletter! 🎉',
        `
          <h1>Welcome!</h1>
          <p>Thanks for subscribing to our newsletter.</p>
          <p>You'll receive our best content directly in your inbox.</p>
          <p>Stay tuned for our next issue!</p>
        `
      );
      break;

    case 'subscriber.updated':
      if (data.subscriber_type === 'premium') {
        // Premium upgrade notification
        await sendEmail(
          data.email,
          data.metadata?.name || '',
          'Welcome to Premium! ⭐',
          `
            <h1>You're Premium Now!</h1>
            <p>Thank you for upgrading to our premium newsletter.</p>
            <p>You now have access to:</p>
            <ul>
              <li>Exclusive content</li>
              <li>Early access to new posts</li>
              <li>Premium-only archives</li>
            </ul>
          `
        );
      }
      break;

    case 'subscriber.unsubscribed':
      // Farewell email
      await sendEmail(
        data.email,
        data.metadata?.name || '',
        "We'll Miss You!",
        `
          <h1>Sorry to See You Go</h1>
          <p>You've been unsubscribed from our newsletter.</p>
          <p>If this was a mistake, you can always resubscribe.</p>
          <p>Thanks for being a reader!</p>
        `
      );
      break;
  }

  res.sendStatus(200);
});

app.listen(3000);
```

### 2. Buttondown API Integration

Sync subscribers and send via ADSMedia:

```javascript
const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY;

async function getButtondownSubscribers() {
  const response = await fetch('https://api.buttondown.email/v1/subscribers', {
    headers: {
      'Authorization': `Token ${BUTTONDOWN_API_KEY}`,
    },
  });
  return response.json();
}

async function sendNewsletterViaADSMedia(subject, html) {
  const { results: subscribers } = await getButtondownSubscribers();
  
  const activeSubscribers = subscribers.filter(s => 
    s.subscriber_type !== 'unactivated' && 
    s.subscriber_type !== 'unsubscribed'
  );

  for (const subscriber of activeSubscribers) {
    await fetch('https://api.adsmedia.live/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: subscriber.email,
        to_name: subscriber.metadata?.name || '',
        subject,
        html,
        from_name: 'Newsletter',
      }),
    });
  }
}
```

## Use Cases

1. **Welcome Sequence** - ADSMedia sends immediate welcome
2. **Transactional** - Receipts, confirmations
3. **High-Volume** - Use ADSMedia for large sends
4. **Backup** - Fallback if Buttondown quota exceeded

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Buttondown](https://buttondown.email)
- [Buttondown API](https://api.buttondown.email/v1/docs)

