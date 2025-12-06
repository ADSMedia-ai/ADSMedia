# ADSMedia Supabase Edge Function

Send emails via ADSMedia API from Supabase Edge Functions.

## Setup

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize (if not already):
   ```bash
   supabase init
   ```

3. Copy the function:
   ```bash
   cp -r send-email supabase/functions/
   ```

4. Set the API key:
   ```bash
   supabase secrets set ADSMEDIA_API_KEY=your-api-key
   ```

5. Deploy:
   ```bash
   supabase functions deploy send-email
   ```

## Usage

### Send Single Email

```javascript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    to: 'user@example.com',
    subject: 'Hello!',
    html: '<h1>Welcome!</h1>',
  },
});
```

### Send Batch Emails

```javascript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    recipients: [
      { email: 'user1@example.com', name: 'User 1' },
      { email: 'user2@example.com', name: 'User 2' },
    ],
    subject: 'Hello %%First Name%%!',
    html: '<h1>Hi %%First Name%%!</h1>',
  },
  headers: {
    'Content-Type': 'application/json',
  },
  // Add ?action=batch to URL
});

// Or with fetch:
fetch('https://your-project.supabase.co/functions/v1/send-email?action=batch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    recipients: [...],
    subject: 'Hello!',
    html: '<h1>Hi!</h1>',
  }),
});
```

### Test Connection

```javascript
const { data, error } = await supabase.functions.invoke('send-email?action=ping');
```

## Request Parameters

### Single Email (`?action=send` or default)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | ✅ | Recipient email |
| `subject` | string | ✅ | Email subject |
| `html` | string | ✅* | HTML content |
| `text` | string | ✅* | Plain text |
| `toName` | string | ❌ | Recipient name |
| `fromName` | string | ❌ | Sender name |
| `replyTo` | string | ❌ | Reply-to email |
| `serverId` | number | ❌ | Server ID |

*Either `html` or `text` required

### Batch Email (`?action=batch`)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipients` | array | ✅ | `[{email, name?}]` |
| `subject` | string | ✅ | Email subject |
| `html` | string | ✅ | HTML content |
| `text` | string | ❌ | Plain text |
| `preheader` | string | ❌ | Preview text |
| `fromName` | string | ❌ | Sender name |
| `serverId` | number | ❌ | Server ID |

## Example: Send on User Signup

```sql
-- In Supabase SQL Editor, create a trigger:
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-email',
    headers := '{"Authorization": "Bearer ' || current_setting('request.headers')::json->>'apikey' || '", "Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'to', NEW.email,
      'subject', 'Welcome!',
      'html', '<h1>Welcome to our app!</h1>'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION send_welcome_email();
```

## Personalization

Use in batch emails:

| Placeholder | Description |
|-------------|-------------|
| `%%First Name%%` | Recipient's name |
| `%%emailaddress%%` | Recipient's email |
| `%%unsubscribelink%%` | Unsubscribe URL |

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

