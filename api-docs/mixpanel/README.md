# ADSMedia + Mixpanel Integration

Send emails based on Mixpanel analytics events.

## Setup

### 1. Mixpanel Cohort Sync

```javascript
const MIXPANEL_API_SECRET = process.env.MIXPANEL_API_SECRET;
const MIXPANEL_PROJECT_ID = process.env.MIXPANEL_PROJECT_ID;
const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;

// Get users from a Mixpanel cohort
async function getCohortUsers(cohortId) {
  const auth = Buffer.from(`${MIXPANEL_API_SECRET}:`).toString('base64');
  
  const response = await fetch(
    `https://mixpanel.com/api/2.0/engage?project_id=${MIXPANEL_PROJECT_ID}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `filter_by_cohort={"id":${cohortId}}`,
    }
  );
  
  return response.json();
}

// Send campaign to cohort
async function sendCampaignToCohort(cohortId, subject, html) {
  const { results } = await getCohortUsers(cohortId);
  
  for (const user of results) {
    const email = user.$properties.$email;
    const name = user.$properties.$name || user.$properties.$first_name;
    
    if (email) {
      await fetch('https://api.adsmedia.live/v1/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          to_name: name || '',
          subject,
          html,
          from_name: 'Marketing',
        }),
      });
    }
  }
}

// Example: Send to churned users cohort
await sendCampaignToCohort(
  123456, // Cohort ID for "Churned Users"
  'We Miss You!',
  '<h1>Come Back!</h1><p>It\'s been a while...</p>'
);
```

### 2. Behavioral Email Triggers

```javascript
// Track event and trigger email
async function trackAndTriggerEmail(userId, event, properties) {
  // 1. Track in Mixpanel
  await fetch('https://api.mixpanel.com/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [{
        event,
        properties: {
          distinct_id: userId,
          token: MIXPANEL_PROJECT_TOKEN,
          ...properties,
        },
      }],
    }),
  });

  // 2. Trigger email based on event
  const emailTriggers = {
    'Completed Onboarding': {
      subject: 'Welcome! You\'re All Set 🎉',
      html: '<h1>Congrats!</h1><p>You\'ve completed onboarding.</p>',
    },
    'First Purchase': {
      subject: 'Thank You for Your First Order!',
      html: '<h1>Order Confirmed!</h1><p>Welcome to our customer family.</p>',
    },
    'Subscription Cancelled': {
      subject: 'We\'re Sorry to See You Go',
      html: '<h1>Feedback Welcome</h1><p>Let us know how we can improve.</p>',
    },
  };

  const trigger = emailTriggers[event];
  if (trigger && properties.email) {
    await fetch('https://api.adsmedia.live/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: properties.email,
        to_name: properties.name || '',
        subject: trigger.subject,
        html: trigger.html,
        from_name: 'Your App',
      }),
    });
  }
}
```

### 3. Weekly Digest Based on User Activity

```javascript
async function sendActivityDigest(userId, email, name) {
  const auth = Buffer.from(`${MIXPANEL_API_SECRET}:`).toString('base64');
  
  // Get user's events from last week
  const response = await fetch(
    `https://mixpanel.com/api/2.0/stream/query?project_id=${MIXPANEL_PROJECT_ID}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_date: getLastWeekDate(),
        to_date: getTodayDate(),
        distinct_ids: [userId],
      }),
    }
  );
  
  const { results } = await response.json();
  
  // Build digest HTML
  const html = `
    <h1>Your Weekly Activity</h1>
    <p>Hi ${name}, here's what you did this week:</p>
    <ul>
      ${results.events.map(e => `<li>${e.event}: ${e.count} times</li>`).join('')}
    </ul>
  `;
  
  await fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: email,
      to_name: name,
      subject: 'Your Weekly Activity Digest',
      html,
      from_name: 'Activity Report',
    }),
  });
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Mixpanel](https://mixpanel.com)
- [Mixpanel API](https://developer.mixpanel.com)

