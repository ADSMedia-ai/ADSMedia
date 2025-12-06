# ADSMedia + Workable Integration

Send candidate emails from Workable ATS.

## Setup

### 1. Workable Webhook Handler

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
      from_name: 'Hiring Team',
    }),
  });
  return response.json();
}

app.post('/webhook/workable', async (req, res) => {
  const { event, data } = req.body;
  const candidate = data.candidate;

  switch (event) {
    case 'candidate_created':
      // Application received
      await sendEmail(
        candidate.email,
        candidate.name,
        'Application Received!',
        `
          <h1>Thanks for Applying!</h1>
          <p>Hi ${candidate.firstname},</p>
          <p>We've received your application for <strong>${data.job.title}</strong>.</p>
          <p>Our team will review your application and get back to you soon.</p>
          <p>Best of luck!</p>
        `
      );
      break;

    case 'candidate_moved':
      if (data.stage.name === 'Interview') {
        await sendEmail(
          candidate.email,
          candidate.name,
          'Interview Invitation!',
          `
            <h1>Great News, ${candidate.firstname}! 🎉</h1>
            <p>We'd love to interview you for the <strong>${data.job.title}</strong> position.</p>
            <p>Please use the link below to schedule your interview:</p>
            <p style="text-align: center;">
              <a href="${data.scheduling_link || '#'}" style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">Schedule Interview</a>
            </p>
          `
        );
      }
      
      if (data.stage.name === 'Offer') {
        await sendEmail(
          candidate.email,
          candidate.name,
          'Offer Extended! 🎉',
          `
            <h1>Congratulations, ${candidate.firstname}!</h1>
            <p>We're excited to extend an offer for the <strong>${data.job.title}</strong> position.</p>
            <p>Please check your email for the full offer details.</p>
          `
        );
      }
      break;

    case 'candidate_disqualified':
      await sendEmail(
        candidate.email,
        candidate.name,
        `Update on Your Application`,
        `
          <h1>Thank You for Your Interest</h1>
          <p>Hi ${candidate.firstname},</p>
          <p>Thank you for applying for the ${data.job.title} position.</p>
          <p>After careful consideration, we've decided to move forward with other candidates.</p>
          <p>We encourage you to apply for future openings that match your skills.</p>
          <p>Best regards,<br>The Hiring Team</p>
        `
      );
      break;
  }

  res.sendStatus(200);
});

app.listen(3000);
```

### 2. Workable API Integration

```javascript
const WORKABLE_API_KEY = process.env.WORKABLE_API_KEY;
const WORKABLE_SUBDOMAIN = process.env.WORKABLE_SUBDOMAIN;

async function getWorkableCandidates(jobShortcode, stage) {
  const response = await fetch(
    `https://${WORKABLE_SUBDOMAIN}.workable.com/spi/v3/jobs/${jobShortcode}/candidates?stage=${stage}`,
    {
      headers: {
        'Authorization': `Bearer ${WORKABLE_API_KEY}`,
      },
    }
  );
  return response.json();
}

// Send reminder to candidates in specific stage
async function sendStageReminder(jobShortcode, stage, subject, html) {
  const { candidates } = await getWorkableCandidates(jobShortcode, stage);
  
  for (const candidate of candidates) {
    await fetch('https://api.adsmedia.live/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADSMEDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: candidate.email,
        to_name: candidate.name,
        subject,
        html: html.replace('{{name}}', candidate.firstname),
        from_name: 'Hiring Team',
      }),
    });
  }
}
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Workable](https://workable.com)
- [Workable API](https://workable.readme.io)

