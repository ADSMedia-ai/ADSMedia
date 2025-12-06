# ADSMedia Analytics Platform Webhooks

Send email notifications based on analytics events from various platforms.

## Supported Platforms

- PostHog
- Mixpanel
- Amplitude
- Plausible
- Google Analytics (via BigQuery exports)

## Use Cases

- Alert team when metrics hit thresholds
- Send reports to stakeholders
- Notify on significant events
- Weekly/Monthly digest emails

## Webhook Handler

```javascript
// analytics-webhook-handler.js
const express = require('express');

const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;
const TEAM_EMAIL = process.env.TEAM_EMAIL || 'team@example.com';

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
      from_name: 'Analytics',
    }),
  });
  return response.json();
}

// --- POSTHOG ---
app.post('/webhook/posthog', async (req, res) => {
  const { event, properties, person, timestamp } = req.body;
  
  // Alert on important events
  const alertEvents = ['purchase_completed', 'subscription_started', 'churn_risk_detected'];
  
  if (alertEvents.includes(event)) {
    await sendEmail(
      TEAM_EMAIL,
      'Team',
      `🔔 PostHog Alert: ${event}`,
      `
        <h1>Analytics Alert</h1>
        <p><strong>Event:</strong> ${event}</p>
        <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <p><strong>User:</strong> ${person?.email || person?.distinct_id || 'Unknown'}</p>
        <h3>Properties:</h3>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
${JSON.stringify(properties, null, 2)}
        </pre>
        <p><a href="https://app.posthog.com">View in PostHog</a></p>
      `
    );
  }
  
  // Revenue milestone alert
  if (event === 'purchase_completed' && properties.total_revenue >= 10000) {
    await sendEmail(
      TEAM_EMAIL,
      'Team',
      '🎉 Revenue Milestone: $10,000!',
      `
        <h1>🎉 Milestone Reached!</h1>
        <p>Total revenue has hit <strong>$${properties.total_revenue.toLocaleString()}</strong>!</p>
      `
    );
  }
  
  res.sendStatus(200);
});

// --- MIXPANEL ---
app.post('/webhook/mixpanel', async (req, res) => {
  const { event, properties } = req.body;
  
  // Funnel completion alert
  if (event === 'funnel_completed' && properties.funnel_name === 'Onboarding') {
    await sendEmail(
      TEAM_EMAIL,
      'Team',
      '✅ User Completed Onboarding',
      `
        <h1>Onboarding Completed</h1>
        <p>User <strong>${properties.user_email}</strong> completed onboarding.</p>
        <p>Time to complete: ${properties.duration_hours} hours</p>
      `
    );
  }
  
  // Cohort threshold alert
  if (event === 'cohort_threshold') {
    await sendEmail(
      TEAM_EMAIL,
      'Team',
      `📊 Cohort Alert: ${properties.cohort_name}`,
      `
        <h1>Cohort Threshold Reached</h1>
        <p>Cohort <strong>${properties.cohort_name}</strong> has reached ${properties.user_count} users.</p>
      `
    );
  }
  
  res.sendStatus(200);
});

// --- AMPLITUDE ---
app.post('/webhook/amplitude', async (req, res) => {
  const { event_type, event_properties, user_properties, user_id } = req.body;
  
  // Engagement drop alert
  if (event_type === 'engagement_alert') {
    await sendEmail(
      TEAM_EMAIL,
      'Team',
      '⚠️ Engagement Drop Detected',
      `
        <h1>Engagement Alert</h1>
        <p>Engagement metrics have dropped significantly:</p>
        <ul>
          <li>Current: ${event_properties.current_value}</li>
          <li>Previous: ${event_properties.previous_value}</li>
          <li>Change: ${event_properties.change_percent}%</li>
        </ul>
      `
    );
  }
  
  res.sendStatus(200);
});

// --- PLAUSIBLE ---
app.post('/webhook/plausible', async (req, res) => {
  const { event_name, props } = req.body;
  
  // Goal completion
  if (event_name === 'Signup') {
    await sendEmail(
      TEAM_EMAIL,
      'Team',
      '🎯 Goal Completed: New Signup',
      `
        <h1>New Signup!</h1>
        <p>Someone just signed up on your site.</p>
        <p>Referrer: ${props.referrer || 'Direct'}</p>
      `
    );
  }
  
  res.sendStatus(200);
});

// --- SCHEDULED REPORTS ---
// Use with cron job
async function sendWeeklyReport(stats) {
  const html = `
    <h1>📊 Weekly Analytics Report</h1>
    <p>Here's your weekly summary:</p>
    
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #f5f5f5;">
        <th style="padding: 12px; text-align: left;">Metric</th>
        <th style="padding: 12px; text-align: right;">This Week</th>
        <th style="padding: 12px; text-align: right;">Last Week</th>
        <th style="padding: 12px; text-align: right;">Change</th>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #ddd;">Page Views</td>
        <td style="padding: 12px; text-align: right;">${stats.pageViews.current.toLocaleString()}</td>
        <td style="padding: 12px; text-align: right;">${stats.pageViews.previous.toLocaleString()}</td>
        <td style="padding: 12px; text-align: right; color: ${stats.pageViews.change > 0 ? 'green' : 'red'};">
          ${stats.pageViews.change > 0 ? '+' : ''}${stats.pageViews.change}%
        </td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #ddd;">Unique Visitors</td>
        <td style="padding: 12px; text-align: right;">${stats.visitors.current.toLocaleString()}</td>
        <td style="padding: 12px; text-align: right;">${stats.visitors.previous.toLocaleString()}</td>
        <td style="padding: 12px; text-align: right; color: ${stats.visitors.change > 0 ? 'green' : 'red'};">
          ${stats.visitors.change > 0 ? '+' : ''}${stats.visitors.change}%
        </td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #ddd;">Signups</td>
        <td style="padding: 12px; text-align: right;">${stats.signups.current}</td>
        <td style="padding: 12px; text-align: right;">${stats.signups.previous}</td>
        <td style="padding: 12px; text-align: right; color: ${stats.signups.change > 0 ? 'green' : 'red'};">
          ${stats.signups.change > 0 ? '+' : ''}${stats.signups.change}%
        </td>
      </tr>
      <tr>
        <td style="padding: 12px;">Revenue</td>
        <td style="padding: 12px; text-align: right;">$${stats.revenue.current.toLocaleString()}</td>
        <td style="padding: 12px; text-align: right;">$${stats.revenue.previous.toLocaleString()}</td>
        <td style="padding: 12px; text-align: right; color: ${stats.revenue.change > 0 ? 'green' : 'red'};">
          ${stats.revenue.change > 0 ? '+' : ''}${stats.revenue.change}%
        </td>
      </tr>
    </table>
    
    <h2>Top Pages</h2>
    <ol>
      ${stats.topPages.map(p => `<li>${p.path} - ${p.views} views</li>`).join('')}
    </ol>
    
    <h2>Top Referrers</h2>
    <ol>
      ${stats.topReferrers.map(r => `<li>${r.source} - ${r.visitors} visitors</li>`).join('')}
    </ol>
    
    <p><a href="https://your-analytics-dashboard.com">View Full Dashboard</a></p>
  `;
  
  await sendEmail(
    TEAM_EMAIL,
    'Team',
    '📊 Weekly Analytics Report',
    html
  );
}

// Example: Trigger weekly report (call from cron)
app.post('/trigger-weekly-report', async (req, res) => {
  const stats = req.body; // Get from your analytics provider
  await sendWeeklyReport(stats);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Analytics webhook handler running on port ${PORT}`));
```

## Platform Setup

### PostHog

1. Go to **Data Management** → **Actions** → **Webhooks**
2. Create webhook for specific actions
3. Or use PostHog's API to create automated reports

### Mixpanel

1. Use Mixpanel's JQL or API to trigger webhooks
2. Set up alerts in Mixpanel that call your webhook

### Amplitude

1. Go to **Data Destinations** → **Webhooks**
2. Configure event-based webhooks

### Plausible

1. Use Plausible's API to fetch data
2. Set up your own cron job to check and alert

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

