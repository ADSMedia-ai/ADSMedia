# ADSMedia Scheduling Platform Webhooks

Handle booking events from scheduling platforms and send transactional emails via ADSMedia.

## Supported Platforms

- Acuity Scheduling
- Calendly
- Cal.com (see dedicated integration)
- YouCanBook.me
- Setmore
- SimplyBook.me
- Square Appointments

## Universal Webhook Handler

```javascript
// scheduling-webhook-handler.js
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
      from_name: 'Appointments',
    }),
  });
  return response.json();
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

// --- ACUITY SCHEDULING ---
app.post('/webhook/acuity', async (req, res) => {
  const { action, appointment } = req.body;
  const { datetime, endTime, email, firstName, lastName, type, confirmationPage, calendar } = appointment;
  const fullName = `${firstName} ${lastName}`;
  const { date, time } = formatDateTime(datetime);
  
  switch (action) {
    case 'scheduled':
      await sendEmail(
        email,
        fullName,
        `Appointment Confirmed: ${type}`,
        `
          <h1>Your appointment is confirmed!</h1>
          <p>Hi ${firstName},</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Date:</strong> ${date}</p>
            <p><strong>🕐 Time:</strong> ${time}</p>
            <p><strong>📌 Type:</strong> ${type}</p>
            <p><strong>👤 With:</strong> ${calendar}</p>
          </div>
          <p><a href="${confirmationPage}" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Appointment</a></p>
        `
      );
      break;
      
    case 'rescheduled':
      await sendEmail(
        email,
        fullName,
        `Appointment Rescheduled: ${type}`,
        `
          <h1>Your appointment has been rescheduled</h1>
          <p>Hi ${firstName},</p>
          <p>New appointment details:</p>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px;">
            <p><strong>📅 New Date:</strong> ${date}</p>
            <p><strong>🕐 New Time:</strong> ${time}</p>
          </div>
        `
      );
      break;
      
    case 'canceled':
      await sendEmail(
        email,
        fullName,
        `Appointment Cancelled: ${type}`,
        `
          <h1>Your appointment has been cancelled</h1>
          <p>Hi ${firstName},</p>
          <p>Your ${type} appointment scheduled for ${date} at ${time} has been cancelled.</p>
          <p><a href="YOUR_BOOKING_LINK">Book Again</a></p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- CALENDLY ---
app.post('/webhook/calendly', async (req, res) => {
  const { event, payload } = req.body;
  
  switch (event) {
    case 'invitee.created':
      const { invitee, scheduled_event } = payload;
      const { date, time } = formatDateTime(scheduled_event.start_time);
      
      await sendEmail(
        invitee.email,
        invitee.name,
        `Meeting Scheduled: ${scheduled_event.event_type.name}`,
        `
          <h1>Your meeting is scheduled!</h1>
          <p>Hi ${invitee.name.split(' ')[0]},</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>📅 Date:</strong> ${date}</p>
            <p><strong>🕐 Time:</strong> ${time}</p>
            <p><strong>📌 Meeting:</strong> ${scheduled_event.event_type.name}</p>
            ${scheduled_event.location?.join_url ? `<p><strong>🔗 Link:</strong> <a href="${scheduled_event.location.join_url}">Join Meeting</a></p>` : ''}
          </div>
          <p><a href="${invitee.cancel_url}">Cancel</a> | <a href="${invitee.reschedule_url}">Reschedule</a></p>
        `
      );
      break;
      
    case 'invitee.canceled':
      await sendEmail(
        payload.invitee.email,
        payload.invitee.name,
        'Meeting Cancelled',
        `
          <h1>Your meeting has been cancelled</h1>
          <p>The scheduled meeting has been cancelled.</p>
          <p><a href="${payload.scheduled_event.event_type.scheduling_url}">Book Another Time</a></p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- YOUCANBOOK.ME ---
app.post('/webhook/youcanbookme', async (req, res) => {
  const { event_type, booking } = req.body;
  const { date, time } = formatDateTime(booking.startsAt);
  
  switch (event_type) {
    case 'booking.created':
      await sendEmail(
        booking.email,
        booking.name,
        `Booking Confirmed: ${booking.title}`,
        `
          <h1>Booking Confirmed!</h1>
          <p>Hi ${booking.name},</p>
          <p>Your booking details:</p>
          <ul>
            <li><strong>Date:</strong> ${date}</li>
            <li><strong>Time:</strong> ${time}</li>
            <li><strong>Duration:</strong> ${booking.duration} minutes</li>
          </ul>
        `
      );
      break;
      
    case 'booking.cancelled':
      await sendEmail(
        booking.email,
        booking.name,
        'Booking Cancelled',
        `
          <h1>Booking Cancelled</h1>
          <p>Your booking for ${date} has been cancelled.</p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- SETMORE ---
app.post('/webhook/setmore', async (req, res) => {
  const { event, data } = req.body;
  const { customer, service, staff, start_time, end_time } = data;
  const { date, time } = formatDateTime(start_time);
  
  switch (event) {
    case 'appointment.created':
      await sendEmail(
        customer.email_id,
        customer.full_name,
        `Appointment Booked: ${service.name}`,
        `
          <h1>Appointment Confirmed!</h1>
          <p>Hi ${customer.full_name},</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Service:</strong> ${service.name}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Staff:</strong> ${staff.name}</p>
            <p><strong>Duration:</strong> ${service.duration} minutes</p>
          </div>
        `
      );
      break;
      
    case 'appointment.cancelled':
      await sendEmail(
        customer.email_id,
        customer.full_name,
        'Appointment Cancelled',
        `
          <h1>Appointment Cancelled</h1>
          <p>Your appointment has been cancelled.</p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- SIMPLYBOOK.ME ---
app.post('/webhook/simplybook', async (req, res) => {
  const { notification_type, client, booking } = req.body;
  const { date, time } = formatDateTime(booking.start_datetime);
  
  switch (notification_type) {
    case 'new_booking':
      await sendEmail(
        client.email,
        client.name,
        `Booking Confirmed: ${booking.service_name}`,
        `
          <h1>Booking Confirmed!</h1>
          <p>Hi ${client.name},</p>
          <p>Your appointment details:</p>
          <ul>
            <li><strong>Service:</strong> ${booking.service_name}</li>
            <li><strong>Date:</strong> ${date}</li>
            <li><strong>Time:</strong> ${time}</li>
            <li><strong>Provider:</strong> ${booking.provider_name}</li>
          </ul>
        `
      );
      break;
      
    case 'booking_cancelled':
      await sendEmail(
        client.email,
        client.name,
        'Booking Cancelled',
        `<h1>Your booking has been cancelled</h1>`
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- SQUARE APPOINTMENTS ---
app.post('/webhook/square-appointments', async (req, res) => {
  const { type, data } = req.body;
  
  switch (type) {
    case 'booking.created':
      const booking = data.object.booking;
      const customer = booking.customer;
      const { date, time } = formatDateTime(booking.start_at);
      
      await sendEmail(
        customer.email_address,
        `${customer.given_name} ${customer.family_name}`,
        'Appointment Confirmed',
        `
          <h1>Your appointment is confirmed!</h1>
          <p>Hi ${customer.given_name},</p>
          <p>Date: ${date}</p>
          <p>Time: ${time}</p>
        `
      );
      break;
  }
  
  res.sendStatus(200);
});

// --- REMINDER SYSTEM ---
// Use with cron job to send reminders
async function sendAppointmentReminders(appointments) {
  for (const apt of appointments) {
    const { date, time } = formatDateTime(apt.datetime);
    
    await sendEmail(
      apt.email,
      apt.name,
      `Reminder: Appointment Tomorrow`,
      `
        <h1>⏰ Appointment Reminder</h1>
        <p>Hi ${apt.name},</p>
        <p>This is a reminder about your upcoming appointment:</p>
        <div style="background: #e8f4fd; padding: 20px; border-radius: 8px;">
          <p><strong>📅 Date:</strong> ${date}</p>
          <p><strong>🕐 Time:</strong> ${time}</p>
          <p><strong>📌 Type:</strong> ${apt.type}</p>
        </div>
        <p><a href="${apt.joinUrl}" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Join Meeting</a></p>
      `
    );
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Scheduling webhook handler running on port ${PORT}`));
```

## Platform Setup

### Acuity Scheduling

1. Go to **Integrations** → **API** → **Webhooks**
2. Add endpoint URLs for each event type

### Calendly

1. Go to **Integrations** → **Webhooks**
2. Create webhook subscription via API
3. Subscribe to `invitee.created`, `invitee.canceled`

### YouCanBook.me

1. Go to **Settings** → **Notifications** → **Webhooks**
2. Add webhook URL

### Setmore

1. Use Setmore API to configure webhooks
2. Register webhook endpoints

### SimplyBook.me

1. Go to **Custom Features** → **API** → **Notifications**
2. Configure webhook URLs

### Square Appointments

1. Go to Developer Dashboard
2. Create webhook subscription
3. Subscribe to `booking.created` event

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

