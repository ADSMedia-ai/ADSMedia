# ADSMedia Coze Plugin

Integrate ADSMedia API into Coze.com AI bots and workflows.

## Overview

Coze.com is an AI chatbot platform that supports custom plugins. This integration allows your Coze bots to send emails and manage email operations.

## Setup

### 1. Create Plugin in Coze

1. Go to [coze.com](https://www.coze.com) → Your Workspace
2. Navigate to **Plugins** → **Create Plugin**
3. Select **API Plugin**

### 2. Configure Plugin

```yaml
Plugin Name: ADSMedia Email
Description: Send emails and manage campaigns via ADSMedia API
Icon: Upload email icon
```

### 3. Add API Configuration

```yaml
Base URL: https://api.adsmedia.live/v1

Authentication:
  Type: Bearer Token
  Token: YOUR_API_KEY
  Header: Authorization
  Prefix: Bearer
```

## API Actions

### Send Email

```yaml
Action Name: Send Email
Description: Send a single transactional email
Method: POST
Path: /send

Request Body:
  type: object
  properties:
    to:
      type: string
      description: Recipient email address
      required: true
    to_name:
      type: string
      description: Recipient name
    subject:
      type: string
      description: Email subject
      required: true
    html:
      type: string
      description: HTML content of the email
      required: true
    text:
      type: string
      description: Plain text content
    from_name:
      type: string
      description: Sender display name

Response:
  type: object
  properties:
    success:
      type: boolean
    data:
      type: object
      properties:
        message_id:
          type: string
        send_id:
          type: integer
        status:
          type: string
```

### Send Batch Email

```yaml
Action Name: Send Batch Email
Description: Send marketing emails to multiple recipients
Method: POST
Path: /send/batch

Request Body:
  type: object
  properties:
    recipients:
      type: array
      description: List of recipients (max 1000)
      items:
        type: object
        properties:
          email:
            type: string
          name:
            type: string
      required: true
    subject:
      type: string
      required: true
    html:
      type: string
      required: true
    from_name:
      type: string
```

### Check Suppression

```yaml
Action Name: Check Suppression
Description: Check if an email address is suppressed
Method: GET
Path: /suppressions/check

Query Parameters:
  email:
    type: string
    description: Email address to check
    required: true

Response:
  type: object
  properties:
    success:
      type: boolean
    data:
      type: object
      properties:
        email:
          type: string
        suppressed:
          type: boolean
        reason:
          type: string
```

### Get Statistics

```yaml
Action Name: Get Statistics
Description: Get email sending statistics
Method: GET
Path: /stats/overview

Response:
  type: object
  properties:
    success:
      type: boolean
    data:
      type: object
      properties:
        total_sent:
          type: integer
        opens:
          type: integer
        clicks:
          type: integer
        bounces:
          type: integer
```

### Test Connection

```yaml
Action Name: Ping
Description: Test API connection
Method: GET
Path: /ping

Response:
  type: object
  properties:
    success:
      type: boolean
    data:
      type: object
      properties:
        message:
          type: string
```

## Bot Configuration

### System Prompt

Add to your bot's system prompt:

```
You have access to ADSMedia email tools. You can:
- Send emails to users (ask for recipient, subject, and content)
- Check if an email is on the suppression list
- Get email statistics
- Test the email API connection

When sending emails, always confirm the details with the user first.
Format HTML content appropriately for email.
```

### Workflow Integration

1. Create a new workflow
2. Add ADSMedia plugin actions
3. Connect to triggers (user input, scheduled, etc.)

## Example Conversations

### Send Welcome Email

```
User: Send a welcome email to john@example.com

Bot: I'll send a welcome email to john@example.com. What would you like the subject and content to be?

User: Subject: "Welcome!" Content: A friendly welcome message

Bot: [Calls Send Email action]
Email sent successfully! 
- To: john@example.com
- Subject: Welcome!
- Message ID: api-123456789-abcdef
```

### Check Email Status

```
User: Is test@example.com on the suppression list?

Bot: [Calls Check Suppression action]
The email test@example.com is not suppressed. You can send emails to this address.
```

### View Statistics

```
User: Show me my email statistics

Bot: [Calls Get Statistics action]
Here are your email statistics:
📊 Total Sent: 5,234
📬 Opens: 2,456 (46.9%)
🔗 Clicks: 892 (17.0%)
❌ Bounces: 45 (0.9%)
```

## Advanced Configuration

### Variables

You can use Coze variables in your actions:

```yaml
to: {{user.email}}
to_name: {{user.name}}
subject: "Hello {{user.first_name}}!"
```

### Conditional Logic

```yaml
Workflow:
  1. Check if email is suppressed
  2. If not suppressed:
     - Send email
     - Log success
  3. If suppressed:
     - Notify user
     - Log skip reason
```

## Error Handling

Configure error responses in your bot:

```
If API returns error:
- Display friendly error message
- Log the issue
- Suggest alternatives

Common errors:
- Invalid email: "That email address doesn't look valid"
- Rate limit: "Too many emails sent. Please wait a moment."
- Auth error: "There's an issue with the email service. Contact support."
```

## Best Practices

1. **Confirm Before Sending** - Always confirm email details with user
2. **Validate Emails** - Check format before API calls
3. **Handle Errors** - Provide helpful error messages
4. **Respect Privacy** - Don't expose sensitive info in logs
5. **Rate Limiting** - Don't spam the API

## Testing

1. Use Coze's built-in testing
2. Test each action individually
3. Test full conversation flows
4. Verify email delivery

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Coze.com](https://www.coze.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

