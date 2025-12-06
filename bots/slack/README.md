# ADSMedia Slack Bot

Send emails via ADSMedia API from Slack.

## Features

- `/email` - Send emails
- `/check-email` - Check suppression
- `/email-usage` - View stats

## Setup

### 1. Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create New App → From scratch
3. Enable Socket Mode
4. Add slash commands:
   - `/email` - Send email
   - `/check-email` - Check suppression
   - `/email-usage` - View usage

### 2. OAuth & Permissions

Add scopes:
- `chat:write`
- `commands`
- `im:history`

### 3. Install & Configure

```bash
pip install slack-bolt requests
```

Set environment variables:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_APP_TOKEN=xapp-...
export ADSMEDIA_API_KEY=your-key
```

### 4. Run

```bash
python bot.py
```

## Commands

### Send Email

```
/email user@example.com Hello World | This is the email body content.
```

### Check Suppression

```
/check-email user@example.com
```

### View Usage

```
/email-usage
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Slack Bolt](https://slack.dev/bolt-python)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

