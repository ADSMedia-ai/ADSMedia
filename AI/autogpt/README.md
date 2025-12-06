# ADSMedia Plugin for AutoGPT

Enable AutoGPT to send emails via ADSMedia API.

## Installation

1. Copy `adsmedia_plugin` to AutoGPT plugins directory
2. Add to `.env`:
   ```
   ALLOWLISTED_PLUGINS=adsmedia_plugin
   ```

## Commands

### Set API Key

```
set_adsmedia_api_key('your-api-key')
```

### Send Email

```
send_email_adsmedia('user@example.com', 'Subject', '<h1>Hello!</h1>')
```

### Check Suppression

```
check_email_suppression('user@example.com')
```

### Test Connection

```
test_adsmedia_connection()
```

## Example Usage in AutoGPT

```
User: Send a welcome email to john@example.com

AutoGPT: I'll send a welcome email to john@example.com.

Thinking: I should first check if the email is suppressed, then send the email.

Action: check_email_suppression('john@example.com')
Result: Email john@example.com is NOT suppressed - safe to send

Action: send_email_adsmedia('john@example.com', 'Welcome!', '<h1>Welcome to our service!</h1>')
Result: Email sent to john@example.com. Message ID: api-123-abc
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

