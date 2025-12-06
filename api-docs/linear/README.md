# ADSMedia + Linear Integration

Send email notifications from Linear issues and project updates.

## Setup

### 1. Linear Webhook to ADSMedia

```javascript
// webhook-handler.js
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;
const LINEAR_WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET;

// Verify Linear webhook signature
function verifySignature(req) {
  const signature = req.headers['linear-signature'];
  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', LINEAR_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return signature === expected;
}

async function sendEmail(to, toName, subject, html) {
  const response = await fetch('https://api.adsmedia.live/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to, to_name: toName, subject, html,
      from_name: 'Linear Notifications',
    }),
  });
  return response.json();
}

app.post('/webhook/linear', async (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  const { action, type, data } = req.body;

  if (type === 'Issue') {
    const issue = data;
    const assignee = issue.assignee;
    
    if (action === 'create' && assignee) {
      await sendEmail(
        assignee.email,
        assignee.name,
        `New Issue Assigned: ${issue.title}`,
        `
          <h1>New Issue Assigned</h1>
          <p><strong>${issue.identifier}</strong>: ${issue.title}</p>
          <p>${issue.description || 'No description'}</p>
          <p>Priority: ${issue.priority}</p>
          <p><a href="${issue.url}">View in Linear →</a></p>
        `
      );
    }

    if (action === 'update' && issue.state?.name === 'Done') {
      // Notify reporter/creator
      await sendEmail(
        issue.creator?.email,
        issue.creator?.name,
        `Issue Completed: ${issue.title}`,
        `
          <h1>Issue Completed ✅</h1>
          <p><strong>${issue.identifier}</strong>: ${issue.title}</p>
          <p>This issue has been marked as complete.</p>
          <p><a href="${issue.url}">View in Linear →</a></p>
        `
      );
    }
  }

  if (type === 'Comment') {
    const comment = data;
    const issue = comment.issue;
    
    // Notify issue assignee about new comment
    if (issue.assignee && comment.user.id !== issue.assignee.id) {
      await sendEmail(
        issue.assignee.email,
        issue.assignee.name,
        `New Comment on ${issue.identifier}`,
        `
          <h1>New Comment</h1>
          <p><strong>${comment.user.name}</strong> commented on ${issue.identifier}:</p>
          <blockquote>${comment.body}</blockquote>
          <p><a href="${issue.url}">View in Linear →</a></p>
        `
      );
    }
  }

  res.sendStatus(200);
});

app.listen(3000);
```

### 2. Configure Linear Webhook

1. Go to **Settings** → **API** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/webhook/linear`
3. Select events: Issues, Comments

### 3. Linear API Integration

Query Linear and send digest emails:

```javascript
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

async function sendWeeklyDigest(userEmail, userName, teamId) {
  // Query Linear GraphQL API
  const response = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Authorization': LINEAR_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          issues(filter: { team: { id: { eq: "${teamId}" } }, updatedAt: { gte: "${getLastWeekDate()}" } }) {
            nodes {
              identifier
              title
              state { name }
              assignee { name }
            }
          }
        }
      `,
    }),
  });

  const { data } = await response.json();
  const issues = data.issues.nodes;

  const html = `
    <h1>Weekly Issue Digest</h1>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #f5f5f5;">
        <th style="padding: 10px; text-align: left;">Issue</th>
        <th style="padding: 10px;">Status</th>
        <th style="padding: 10px;">Assignee</th>
      </tr>
      ${issues.map(i => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${i.identifier}: ${i.title}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${i.state.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${i.assignee?.name || '-'}</td>
        </tr>
      `).join('')}
    </table>
  `;

  await sendEmail(userEmail, userName, 'Weekly Issue Digest', html);
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Linear](https://linear.app)
- [Linear API](https://developers.linear.app)

