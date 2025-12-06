# ADSMedia Webinar Platform Webhooks

Handle webinar events from various platforms and send transactional emails via ADSMedia.

## Supported Platforms

- Demio
- WebinarJam
- eWebinar
- BigMarker
- Crowdcast

## Universal Webhook Handler

```javascript
// webinar-webhook-handler.js
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
      to,
      to_name: toName,
      subject,
      html,
      from_name: 'Webinars',
    }),
  });
  return response.json();
}

// --- DEMIO ---
app.post('/webhook/demio', async (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'registered':
      await sendEmail(
        data.email,
        data.name,
        `You're Registered: ${data.session.name}`,
        `
          <h1>You're Registered! 🎉</h1>
          <p>Hi ${data.name},</p>
          <p>You've successfully registered for:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">${data.session.name}</h2>
            <p><strong>📅 Date:</strong> ${data.session.date}</p>
            <p><strong>🕐 Time:</strong> ${data.session.time}</p>
          </div>
          <p><a href="${data.join_url}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Add to Calendar</a></p>
          <p>Your unique join link: <a href="${data.join_url}">${data.join_url}</a></p>
        `
      );
      break;
      
    case 'attended':
      await sendEmail(
        data.email,
        data.name,
        `Thanks for Attending: ${data.session.name}`,
        `
          <h1>Thanks for Joining!</h1>
          <p>Hi ${data.name},</p>
          <p>Thank you for attending <strong>${data.session.name}</strong>.</p>
          ${data.replay_url ? `
            <p><a href="${data.replay_url}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Watch Replay</a></p>
          ` : ''}
        `
      );
      break;
      
    case 'missed':
      await sendEmail(
        data.email,
        data.name,
        `We Missed You: ${data.session.name}`,
        `
          <h1>We Missed You!</h1>
          <p>Hi ${data.name},</p>
          <p>We noticed you couldn't make it to <strong>${data.session.name}</strong>.</p>
          <p>Don't worry - you can still catch the replay:</p>
          <p><a href="${data.replay_url}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Watch Replay</a></p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- WEBINARJAM ---
app.post('/webhook/webinarjam', async (req, res) => {
  const { event_type, webinar, registrant } = req.body;
  
  switch (event_type) {
    case 'registration':
      await sendEmail(
        registrant.email,
        registrant.name,
        `Registered: ${webinar.name}`,
        `
          <h1>Registration Confirmed!</h1>
          <p>Hi ${registrant.name},</p>
          <p>You're registered for: <strong>${webinar.name}</strong></p>
          <p><strong>Date:</strong> ${webinar.schedule_date}</p>
          <p><strong>Time:</strong> ${webinar.schedule_time}</p>
          <p><a href="${registrant.live_room_url}">Join Webinar</a></p>
        `
      );
      break;
      
    case 'attended':
      await sendEmail(
        registrant.email,
        registrant.name,
        `Thanks for Attending ${webinar.name}!`,
        `
          <h1>Thank You!</h1>
          <p>Thanks for joining ${webinar.name}.</p>
          <p>Watch time: ${registrant.watch_time} minutes</p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- EWEBINAR ---
app.post('/webhook/ewebinar', async (req, res) => {
  const { type, registrant, session, webinar } = req.body;
  
  switch (type) {
    case 'registrant.registered':
      await sendEmail(
        registrant.email,
        `${registrant.firstName} ${registrant.lastName}`,
        `You're Registered: ${webinar.title}`,
        `
          <h1>Registration Confirmed!</h1>
          <p>Hi ${registrant.firstName},</p>
          <p>You've registered for: <strong>${webinar.title}</strong></p>
          <p>Session: ${session.startTime}</p>
          <p><a href="${registrant.joinUrl}">Join Session</a></p>
        `
      );
      break;
      
    case 'registrant.attended':
      await sendEmail(
        registrant.email,
        registrant.firstName,
        `Thanks for Attending!`,
        `
          <h1>Thanks for Watching!</h1>
          <p>We hope you enjoyed ${webinar.title}.</p>
          ${webinar.replayUrl ? `<p><a href="${webinar.replayUrl}">Watch Again</a></p>` : ''}
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- BIGMARKER ---
app.post('/webhook/bigmarker', async (req, res) => {
  const { event, conference, attendee } = req.body;
  
  switch (event) {
    case 'registration':
      await sendEmail(
        attendee.email,
        attendee.first_name,
        `Registered: ${conference.title}`,
        `
          <h1>You're In!</h1>
          <p>Hi ${attendee.first_name},</p>
          <p>You're registered for <strong>${conference.title}</strong>.</p>
          <p>Date: ${conference.start_time}</p>
          <p><a href="${attendee.join_url}">Join Conference</a></p>
        `
      );
      break;
      
    case 'attended':
      await sendEmail(
        attendee.email,
        attendee.first_name,
        `Thanks for Attending ${conference.title}`,
        `
          <h1>Thank You!</h1>
          <p>Thanks for joining ${conference.title}.</p>
          ${conference.replay_url ? `<p><a href="${conference.replay_url}">Watch Replay</a></p>` : ''}
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- CROWDCAST ---
app.post('/webhook/crowdcast', async (req, res) => {
  const { event, user, episode } = req.body;
  
  switch (event) {
    case 'user.registered':
      await sendEmail(
        user.email,
        user.displayName,
        `You're Registered: ${episode.title}`,
        `
          <h1>Registration Confirmed!</h1>
          <p>Hi ${user.displayName},</p>
          <p>You're registered for: <strong>${episode.title}</strong></p>
          <p>Live: ${episode.scheduledFor}</p>
          <p><a href="${episode.url}">Event Page</a></p>
        `
      );
      break;
      
    case 'user.attended':
      await sendEmail(
        user.email,
        user.displayName,
        `Thanks for Joining!`,
        `
          <h1>Thanks for Attending!</h1>
          <p>We hope you enjoyed ${episode.title}.</p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- REMINDER SYSTEM ---
async function sendWebinarReminder(registrants, webinar, hoursUntil) {
  const subject = hoursUntil === 24 
    ? `Reminder: ${webinar.name} is Tomorrow!`
    : `Starting Soon: ${webinar.name} in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}!`;
  
  for (const registrant of registrants) {
    await sendEmail(
      registrant.email,
      registrant.name,
      subject,
      `
        <h1>⏰ ${hoursUntil === 24 ? 'Tomorrow' : 'Starting Soon'}!</h1>
        <p>Hi ${registrant.name},</p>
        <p><strong>${webinar.name}</strong> ${hoursUntil === 24 ? 'is tomorrow' : `starts in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`}!</p>
        <div style="background: #4F46E5; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="font-size: 18px; margin: 0;">${webinar.date} at ${webinar.time}</p>
        </div>
        <p style="text-align: center; margin-top: 20px;">
          <a href="${registrant.joinUrl}" style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-size: 16px;">Join Webinar</a>
        </p>
      `
    );
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webinar webhook handler running on port ${PORT}`));
```

## Email Templates

### Registration Confirmation

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
    <h1 style="color: white; margin: 0;">🎬 You're Registered!</h1>
  </div>
  
  <div style="padding: 30px;">
    <p>Hi {{name}},</p>
    <p>You've successfully registered for:</p>
    
    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; border-left: 4px solid #667eea;">
      <h2 style="margin-top: 0; color: #333;">{{webinar.title}}</h2>
      <p><strong>📅</strong> {{webinar.date}}</p>
      <p><strong>🕐</strong> {{webinar.time}} {{webinar.timezone}}</p>
      <p><strong>⏱️</strong> {{webinar.duration}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{join_url}}" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-size: 16px; font-weight: bold;">Add to Calendar</a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      Your unique join link: <a href="{{join_url}}">{{join_url}}</a>
    </p>
  </div>
</body>
</html>
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

