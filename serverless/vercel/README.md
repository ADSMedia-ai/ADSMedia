# ADSMedia Vercel Functions

Serverless email API endpoints on Vercel.

## Deployment

1. Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    { "src": "api/*.ts", "use": "@vercel/node" }
  ]
}
```

2. Set environment variable:

```bash
vercel env add ADSMEDIA_API_KEY
```

3. Deploy:

```bash
vercel deploy
```

## Endpoints

### Send Email

```
POST /api/send
{
  "to": "user@example.com",
  "subject": "Hello!",
  "html": "<h1>Welcome!</h1>"
}
```

### Check Suppression

```
GET /api/check?email=user@example.com
```

## Usage

```javascript
// From frontend
const response = await fetch('/api/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Welcome!',
    html: '<h1>Hello!</h1>',
  }),
});

const result = await response.json();
console.log(result.data.message_id);
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

