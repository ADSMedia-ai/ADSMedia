# ADSMedia FlowiseAI Custom Tool

Send emails via ADSMedia API from FlowiseAI.

## Installation

1. Open FlowiseAI
2. Go to **Tools** → **Custom Tool**
3. Import `adsmedia-tool.json`

Or manually create:

### Send Email Tool

```javascript
// Name: adsmedia_send_email
// Description: Send an email via ADSMedia API

const apiKey = $vars.ADSMEDIA_API_KEY;

const response = await fetch('https://api.adsmedia.live/v1/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: $to,
    subject: $subject,
    html: $html
  })
});

const data = await response.json();

if (data.success) {
  return `Email sent! Message ID: ${data.data.message_id}`;
} else {
  return `Error: ${data.error || 'Unknown'}`;
}
```

**Input Variables:**
- `to` (string): Recipient email
- `subject` (string): Email subject
- `html` (string): HTML content

### Check Suppression Tool

```javascript
// Name: adsmedia_check_suppression
// Description: Check if email is suppressed

const apiKey = $vars.ADSMEDIA_API_KEY;

const response = await fetch(
  `https://api.adsmedia.live/v1/suppressions/check?email=${encodeURIComponent($email)}`,
  { headers: { 'Authorization': `Bearer ${apiKey}` } }
);

const data = await response.json();

if (data.success) {
  if (data.data.suppressed) {
    return `Email ${$email} is SUPPRESSED: ${data.data.reason}`;
  }
  return `Email ${$email} is safe to send.`;
}
return `Error: ${data.error}`;
```

**Input Variables:**
- `email` (string): Email to check

## Configuration

Set `ADSMEDIA_API_KEY` in FlowiseAI Variables.

## Usage

1. Add Custom Tool node to your flow
2. Connect to LLM/Agent
3. The agent can now send emails via ADSMedia

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [FlowiseAI Docs](https://docs.flowiseai.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

