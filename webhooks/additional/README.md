# Additional Webhook Integrations

Universal webhook handlers for various platforms.

## Generic Webhook Handler

This handler processes webhooks from multiple platforms and sends emails via ADSMedia.

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
      from_name: 'Notifications',
    }),
  });
  return response.json();
}

// Reform (form builder)
app.post('/webhook/reform', async (req, res) => {
  const { submission } = req.body;
  await sendEmail(
    submission.email,
    submission.name || '',
    'Thanks for your submission!',
    `<h1>Received!</h1><p>We got your form submission.</p>`
  );
  res.sendStatus(200);
});

// Basin (form backend)
app.post('/webhook/basin', async (req, res) => {
  const data = req.body;
  if (data.email) {
    await sendEmail(
      data.email,
      data.name || '',
      'Form Received',
      `<h1>Thank you!</h1><p>Your submission has been received.</p>`
    );
  }
  res.sendStatus(200);
});

// Paperform
app.post('/webhook/paperform', async (req, res) => {
  const { data } = req.body;
  const email = data.find(f => f.type === 'email')?.value;
  const name = data.find(f => f.type === 'text' && f.title?.includes('name'))?.value;
  
  if (email) {
    await sendEmail(email, name || '', 'Submission Confirmed', '<h1>Thanks!</h1>');
  }
  res.sendStatus(200);
});

// Cognito Forms
app.post('/webhook/cognito', async (req, res) => {
  const { entry } = req.body;
  if (entry.Email) {
    await sendEmail(
      entry.Email,
      entry.Name || '',
      'Thank You!',
      '<h1>Form Received</h1>'
    );
  }
  res.sendStatus(200);
});

// Wufoo
app.post('/webhook/wufoo', async (req, res) => {
  const email = req.body.Field1; // Email field
  const name = req.body.Field2; // Name field
  
  if (email) {
    await sendEmail(email, name || '', 'Thanks!', '<h1>Got it!</h1>');
  }
  res.sendStatus(200);
});

// Carrd (site builder)
app.post('/webhook/carrd', async (req, res) => {
  const { email, name } = req.body;
  if (email) {
    await sendEmail(email, name || '', 'Welcome!', '<h1>Thanks for signing up!</h1>');
  }
  res.sendStatus(200);
});

// Swipe Pages (landing pages)
app.post('/webhook/swipepages', async (req, res) => {
  const lead = req.body;
  if (lead.email) {
    await sendEmail(
      lead.email,
      lead.name || '',
      'Thanks for Your Interest!',
      '<h1>We\'ll be in touch soon!</h1>'
    );
  }
  res.sendStatus(200);
});

// NocoDB / Baserow (database webhooks)
app.post('/webhook/database', async (req, res) => {
  const { record, action } = req.body;
  
  if (action === 'create' && record.email) {
    await sendEmail(
      record.email,
      record.name || '',
      'Record Created',
      `<h1>Entry Added</h1><p>Your data has been recorded.</p>`
    );
  }
  res.sendStatus(200);
});

// Recurly (subscription billing)
app.post('/webhook/recurly', async (req, res) => {
  const { type, account } = req.body;
  
  switch (type) {
    case 'new_subscription_notification':
      await sendEmail(
        account.email,
        `${account.first_name} ${account.last_name}`,
        'Subscription Active!',
        '<h1>Welcome!</h1><p>Your subscription is now active.</p>'
      );
      break;
    case 'canceled_subscription_notification':
      await sendEmail(
        account.email,
        `${account.first_name} ${account.last_name}`,
        'Subscription Cancelled',
        '<h1>Sorry to See You Go</h1>'
      );
      break;
  }
  res.sendStatus(200);
});

// Survicate / Delighted (surveys)
app.post('/webhook/survey', async (req, res) => {
  const { respondent, score } = req.body;
  
  if (respondent?.email && score >= 9) {
    await sendEmail(
      respondent.email,
      respondent.name || '',
      'Thank You for Your Feedback!',
      `<h1>You're Amazing!</h1><p>Thanks for the great rating.</p>`
    );
  }
  res.sendStatus(200);
});

// Canny (feature requests)
app.post('/webhook/canny', async (req, res) => {
  const { type, object } = req.body;
  
  if (type === 'post.status_changed' && object.status === 'complete') {
    // Notify all voters
    for (const voter of object.voters || []) {
      await sendEmail(
        voter.email,
        voter.name,
        'Feature Shipped! 🚀',
        `<h1>Great News!</h1><p>The feature you requested is now available: ${object.title}</p>`
      );
    }
  }
  res.sendStatus(200);
});

// Chat platforms (Olark, Tawk.to)
app.post('/webhook/chat', async (req, res) => {
  const { event, visitor, transcript } = req.body;
  
  if (event === 'chat.ended' && visitor?.email) {
    await sendEmail(
      visitor.email,
      visitor.name || '',
      'Chat Transcript',
      `<h1>Your Chat Summary</h1><pre>${transcript}</pre>`
    );
  }
  res.sendStatus(200);
});

// Affiliate/Referral (Rewardful, FirstPromoter, Tapfiliate)
app.post('/webhook/affiliate', async (req, res) => {
  const { event, affiliate } = req.body;
  
  switch (event) {
    case 'affiliate.created':
      await sendEmail(
        affiliate.email,
        affiliate.name,
        'Welcome to Our Affiliate Program!',
        '<h1>You\'re In!</h1><p>Start referring and earning.</p>'
      );
      break;
    case 'conversion.created':
      await sendEmail(
        affiliate.email,
        affiliate.name,
        'New Conversion! 💰',
        `<h1>Cha-ching!</h1><p>You earned a new commission.</p>`
      );
      break;
  }
  res.sendStatus(200);
});

// Creator platforms (Ko-fi, Buy Me a Coffee)
app.post('/webhook/creator', async (req, res) => {
  const { type, from_name, email, amount } = req.body;
  
  if (type === 'Donation' || type === 'subscription') {
    await sendEmail(
      email,
      from_name,
      'Thank You for Your Support! 💖',
      `<h1>You're Amazing!</h1><p>Thanks for supporting with ${amount}.</p>`
    );
  }
  res.sendStatus(200);
});

app.listen(3000);
```

## Supported Platforms

| Platform | Event Types |
|----------|------------|
| Reform | Form submissions |
| Basin | Form submissions |
| Paperform | Form submissions |
| Cognito Forms | Form entries |
| Wufoo | Form entries |
| Carrd | Sign-ups |
| Swipe Pages | Leads |
| NocoDB/Baserow | Record CRUD |
| Recurly | Subscription events |
| Survicate/Delighted | Survey responses |
| Canny | Feature requests |
| Olark/Tawk.to | Chat events |
| Rewardful/FirstPromoter | Affiliate events |
| Ko-fi/Buy Me a Coffee | Donations |

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

