# ADSMedia Telegram Bot

Send emails via Telegram commands.

## Features

- `/send` - Send an email (conversation)
- `/check <email>` - Check if email is suppressed
- `/usage` - View account usage
- `/ping` - Test API connection

## Setup

### 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot`
3. Follow prompts to create bot
4. Copy the token

### 2. Configure Environment

Create `.env` file:

```env
TELEGRAM_TOKEN=your-telegram-bot-token
ADSMEDIA_API_KEY=your-adsmedia-api-key
```

### 3. Install & Run

```bash
pip install python-telegram-bot requests python-dotenv
python bot.py
```

## Commands

### /send

Interactive email sending:

```
User: /send
Bot: Enter recipient email:
User: john@example.com
Bot: Enter subject line:
User: Hello!
Bot: Enter message (HTML supported):
User: <h1>Welcome!</h1>
Bot: ✅ Email Sent! Message ID: api-123-abc
```

### /check

Check email suppression:

```
/check user@example.com
```

### /usage

View usage stats:

```
/usage
```

### /ping

Test connection:

```
/ping
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "bot.py"]
```

### Railway / Render

Set environment variables and deploy.

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [python-telegram-bot Docs](https://docs.python-telegram-bot.org)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

