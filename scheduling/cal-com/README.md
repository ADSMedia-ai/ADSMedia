# ADSMedia Cal.com Integration

Send custom emails for Cal.com booking events using ADSMedia API.

## Overview

Integrate with Cal.com to send branded booking confirmations, reminders, and follow-up emails via ADSMedia.

## Setup Methods

### Method 1: Cal.com Webhooks

Use Cal.com webhooks to trigger ADSMedia emails.

### Method 2: Cal.com App (Open Source)

Contribute to Cal.com's open-source codebase.

## Webhook Integration

### 1. Create Webhook Handler

Deploy a webhook handler:

```javascript
// cal-webhook-handler.js
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const ADSMEDIA_API_KEY = process.env.ADSMEDIA_API_KEY;
const CAL_WEBHOOK_SECRET = process.env.CAL_WEBHOOK_SECRET;

// Verify webhook signature
function verifySignature(req) {
  const signature = req.headers['cal-signature'];
  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', CAL_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return signature === expected;
}

app.post('/cal-webhook', async (req, res) => {
  // Verify signature
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  const { triggerEvent, payload } = req.body;

  try {
    switch (triggerEvent) {
      case 'BOOKING_CREATED':
        await handleBookingCreated(payload);
        break;
      case 'BOOKING_RESCHEDULED':
        await handleBookingRescheduled(payload);
        break;
      case 'BOOKING_CANCELLED':
        await handleBookingCancelled(payload);
        break;
      case 'BOOKING_CONFIRMED':
        await handleBookingConfirmed(payload);
        break;
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

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
      from_name: 'My Calendar',
    }),
  });

  return response.json();
}

async function handleBookingCreated(booking) {
  const { attendees, eventType, startTime, endTime, organizer } = booking;
  
  for (const attendee of attendees) {
    await sendEmail(
      attendee.email,
      attendee.name,
      `Booking Confirmed: ${eventType.title}`,
      `
        <h1>Your Booking is Confirmed!</h1>
        <p>Hi ${attendee.name},</p>
        <p>Your booking has been confirmed:</p>
        <table style="border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Event:</td>
            <td style="padding: 8px;">${eventType.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Date:</td>
            <td style="padding: 8px;">${new Date(startTime).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Time:</td>
            <td style="padding: 8px;">${new Date(startTime).toLocaleTimeString()} - ${new Date(endTime).toLocaleTimeString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">With:</td>
            <td style="padding: 8px;">${organizer.name}</td>
          </tr>
        </table>
        <p><a href="${booking.meetingUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Join Meeting</a></p>
        <p>See you soon!</p>
      `
    );
  }

  // Also notify organizer
  await sendEmail(
    organizer.email,
    organizer.name,
    `New Booking: ${eventType.title} with ${attendees[0].name}`,
    `
      <h1>New Booking!</h1>
      <p>${attendees[0].name} has booked a ${eventType.title} with you.</p>
      <p><strong>Date:</strong> ${new Date(startTime).toLocaleString()}</p>
      <p><strong>Email:</strong> ${attendees[0].email}</p>
    `
  );
}

async function handleBookingRescheduled(booking) {
  const { attendees, eventType, startTime, endTime } = booking;
  
  for (const attendee of attendees) {
    await sendEmail(
      attendee.email,
      attendee.name,
      `Booking Rescheduled: ${eventType.title}`,
      `
        <h1>Your Booking Has Been Rescheduled</h1>
        <p>Hi ${attendee.name},</p>
        <p>Your booking has been rescheduled to:</p>
        <p><strong>New Date:</strong> ${new Date(startTime).toLocaleDateString()}</p>
        <p><strong>New Time:</strong> ${new Date(startTime).toLocaleTimeString()} - ${new Date(endTime).toLocaleTimeString()}</p>
        <p>If this doesn't work for you, please reschedule.</p>
      `
    );
  }
}

async function handleBookingCancelled(booking) {
  const { attendees, eventType, startTime } = booking;
  
  for (const attendee of attendees) {
    await sendEmail(
      attendee.email,
      attendee.name,
      `Booking Cancelled: ${eventType.title}`,
      `
        <h1>Your Booking Has Been Cancelled</h1>
        <p>Hi ${attendee.name},</p>
        <p>Unfortunately, your booking for ${eventType.title} on ${new Date(startTime).toLocaleDateString()} has been cancelled.</p>
        <p>Feel free to book another time that works for you.</p>
        <p><a href="https://cal.com/yourusername">Book Again</a></p>
      `
    );
  }
}

async function handleBookingConfirmed(booking) {
  // For manual confirmation events
  const { attendees, eventType, startTime, endTime } = booking;
  
  for (const attendee of attendees) {
    await sendEmail(
      attendee.email,
      attendee.name,
      `Booking Confirmed: ${eventType.title}`,
      `
        <h1>Great news! Your booking is confirmed!</h1>
        <p>Hi ${attendee.name},</p>
        <p>Your booking request has been approved.</p>
        <p><strong>Event:</strong> ${eventType.title}</p>
        <p><strong>When:</strong> ${new Date(startTime).toLocaleString()}</p>
        <p>Looking forward to meeting you!</p>
      `
    );
  }
}

app.listen(3000, () => console.log('Cal.com webhook handler running'));
```

### 2. Configure Cal.com Webhook

1. Go to Cal.com → **Settings** → **Developer** → **Webhooks**
2. Click **New Webhook**
3. Configure:

```yaml
Subscriber URL: https://your-domain.com/cal-webhook
Event Triggers:
  - BOOKING_CREATED
  - BOOKING_RESCHEDULED
  - BOOKING_CANCELLED
  - BOOKING_CONFIRMED
Secret: your-webhook-secret
```

## Email Templates

### Confirmation Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
    .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi {{attendee.name}},</p>
      <p>Your booking has been confirmed. Here are the details:</p>
      <div class="details">
        <p><strong>📌 Event:</strong> {{event.title}}</p>
        <p><strong>📅 Date:</strong> {{event.date}}</p>
        <p><strong>🕐 Time:</strong> {{event.time}}</p>
        <p><strong>👤 With:</strong> {{organizer.name}}</p>
        <p><strong>📍 Location:</strong> {{event.location}}</p>
      </div>
      <p style="text-align: center;">
        <a href="{{meeting.url}}" class="button">Join Meeting</a>
      </p>
      <p>Add to your calendar:</p>
      <p>
        <a href="{{calendar.google}}">Google</a> |
        <a href="{{calendar.outlook}}">Outlook</a> |
        <a href="{{calendar.ical}}">iCal</a>
      </p>
    </div>
    <div class="footer">
      <p>Need to make changes? <a href="{{reschedule.url}}">Reschedule</a> or <a href="{{cancel.url}}">Cancel</a></p>
    </div>
  </div>
</body>
</html>
```

### Reminder Template

```html
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
    <h1>⏰ Reminder: Your meeting is tomorrow!</h1>
    <p>Hi {{attendee.name}},</p>
    <p>This is a friendly reminder about your upcoming meeting:</p>
    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px;">
      <p><strong>{{event.title}}</strong></p>
      <p>📅 {{event.date}} at {{event.time}}</p>
      <p>👤 With {{organizer.name}}</p>
    </div>
    <p><a href="{{meeting.url}}" style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Join Meeting</a></p>
  </div>
</body>
</html>
```

## Scheduled Reminders

Use a cron job to send reminders:

```javascript
// reminder-job.js
const cron = require('node-cron');

// Run every hour
cron.schedule('0 * * * *', async () => {
  const upcomingBookings = await getBookingsInNextHours(24);
  
  for (const booking of upcomingBookings) {
    if (!booking.reminderSent) {
      await sendReminderEmail(booking);
      await markReminderSent(booking.id);
    }
  }
});
```

## Best Practices

1. **Verify Webhooks** - Always check signature
2. **Idempotency** - Handle duplicate events
3. **Error Handling** - Retry failed sends
4. **Personalization** - Use attendee data
5. **Timezone Handling** - Convert times properly

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Cal.com](https://cal.com)
- [Cal.com Docs](https://cal.com/docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

