# ADSMedia + Amplitude Integration

Send emails based on Amplitude analytics cohorts and events.

## Setup

### 1. Amplitude Cohort Export

```javascript
const AMPLITUDE_API_KEY = process.env.AMPLITUDE_API_KEY;
const AMPLITUDE_SECRET_KEY = process.env.AMPLITUDE_SECRET_KEY;
const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

// Export cohort users
async function getCohortUsers(cohortId) {
  const auth = Buffer.from(`${AMPLITUDE_API_KEY}:${AMPLITUDE_SECRET_KEY}`).toString('base64');
  
  const response = await fetch(
    `https://amplitude.com/api/3/cohorts/${cohortId}/users`,
    {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    }
  );
  
  return response.json();
}

// Send to Amplitude cohort
async function sendToCohort(cohortId, subject, htmlTemplate) {
  const { users } = await getCohortUsers(cohortId);
  
  for (const user of users) {
    if (user.user_properties?.email) {
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.user_properties.email,
          to_name: user.user_properties.name || '',
          subject,
          html: htmlTemplate.replace('{{name}}', user.user_properties.name || 'there'),
          from_name: 'Your App',
        }),
      });
    }
  }
}

// Example: Send to "Power Users" cohort
await sendToCohort(
  'cohort_power_users',
  'Thank You for Being a Power User!',
  '<h1>Hi {{name}}!</h1><p>You\'re one of our top users.</p>'
);
```

### 2. Event-Based Email Triggers

```javascript
// Amplitude webhook handler
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook/amplitude', async (req, res) => {
  const { events } = req.body;
  
  for (const event of events) {
    const triggers = {
      'trial_started': {
        subject: 'Welcome to Your Trial!',
        html: '<h1>Your Trial Has Started</h1><p>Make the most of your 14 days.</p>',
      },
      'trial_ending_soon': {
        subject: 'Your Trial Ends Soon!',
        html: '<h1>3 Days Left</h1><p>Upgrade now to keep your data.</p>',
      },
      'feature_discovered': {
        subject: 'Great Discovery!',
        html: `<h1>You Found ${event.event_properties.feature_name}!</h1><p>Here's how to master it.</p>`,
      },
    };

    const trigger = triggers[event.event_type];
    const email = event.user_properties?.email;
    
    if (trigger && email) {
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          to_name: event.user_properties.name || '',
          subject: trigger.subject,
          html: trigger.html,
          from_name: 'Product Team',
        }),
      });
    }
  }
  
  res.sendStatus(200);
});

app.listen(3000);
```

### 3. Retention Campaign

```javascript
async function sendRetentionCampaign(daysInactive, subject, html) {
  const auth = Buffer.from(`${AMPLITUDE_API_KEY}:${AMPLITUDE_SECRET_KEY}`).toString('base64');
  
  // Query inactive users
  const response = await fetch(
    'https://amplitude.com/api/2/usersearch',
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_search: {
          filter: {
            last_seen: {
              comparator: 'less_than',
              value: Date.now() - (daysInactive * 24 * 60 * 60 * 1000),
            },
          },
        },
      }),
    }
  );
  
  const { users } = await response.json();
  
  for (const user of users) {
    if (user.email) {
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.email,
          to_name: user.name || '',
          subject,
          html,
          from_name: 'Win-Back Team',
        }),
      });
    }
  }
}

// Send to users inactive for 30 days
await sendRetentionCampaign(
  30,
  'We Miss You!',
  '<h1>Come Back!</h1><p>See what\'s new since you left.</p>'
);
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Amplitude](https://amplitude.com)
- [Amplitude API](https://www.docs.developers.amplitude.com)

