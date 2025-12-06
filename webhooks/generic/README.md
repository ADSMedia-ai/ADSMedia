# Generic Webhook Handler for ADSMedia

Universal webhook receiver that sends emails via ADSMedia API.

## Deployment

### Vercel

```bash
vercel deploy
```

### Netlify Functions

Copy to `netlify/functions/webhook-handler.js`

### AWS Lambda

Package and deploy with API Gateway.

### Cloudflare Workers

Adapt for Workers API.

## Configuration

Set environment variables:

```
ADSMEDIA_API_KEY=your-api-key
NOTIFICATION_EMAIL=admin@example.com
```

Or send via headers:

```
X-ADSMedia-Key: your-api-key
X-Notification-Email: admin@example.com
```

## Usage

### Send webhook with type

```bash
curl -X POST https://your-handler.com/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "form_submission",
    "to": "user@example.com",
    "data": {
      "formName": "Contact Form",
      "fields": {
        "name": "John Doe",
        "email": "john@example.com",
        "message": "Hello!"
      }
    }
  }'
```

### Available Templates

| Type | Description |
|------|-------------|
| `form_submission` | Form data table |
| `user_signup` | Welcome email |
| `order_placed` | Order confirmation |
| `payment_received` | Payment receipt |
| `appointment_booked` | Booking confirmation |
| `notification` | Generic notification |

## Platform Integrations

### Tally

1. Form Settings → Webhooks
2. Add your handler URL
3. Set type: `form_submission`

### Gumroad

1. Settings → Webhooks
2. Add handler URL
3. Events: sales, refunds

### Lemon Squeezy

1. Settings → Webhooks
2. Add endpoint
3. Set type: `payment_received`

### Cal.com / Acuity

1. Webhooks → Add
2. URL: your handler
3. Type: `appointment_booked`

## Custom Templates

Add to `templates` object:

```javascript
templates.my_custom = (data) => ({
  subject: `Custom: ${data.title}`,
  html: `<h1>${data.content}</h1>`,
});
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

