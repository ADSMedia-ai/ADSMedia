# ADSMedia Cloudflare Worker

Serverless email sending via Cloudflare Workers.

## Features

- Global edge deployment
- Low latency
- Free tier available
- CORS enabled

## Deployment

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Set API key:
   ```bash
   wrangler secret put ADSMEDIA_API_KEY
   ```

3. Deploy:
   ```bash
   wrangler deploy
   ```

## Endpoints

### Send Email
```
POST /send
{
  "to": "user@example.com",
  "subject": "Hello!",
  "html": "<h1>Welcome!</h1>"
}
```

### Send Batch
```
POST /send/batch
{
  "recipients": [{"email": "...", "name": "..."}],
  "subject": "Hello %%First Name%%!",
  "html": "<h1>Hi!</h1>"
}
```

### Check Suppression
```
GET /check?email=user@example.com
```

### Ping
```
GET /ping
```

## Usage

```javascript
const response = await fetch('https://adsmedia-email.your-subdomain.workers.dev/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Hello!',
    html: '<h1>Welcome!</h1>',
  }),
});

const data = await response.json();
console.log(data.data.message_id);
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Cloudflare Workers](https://workers.cloudflare.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

