# ADSMedia Discord Bot

Send emails via Discord slash commands.

## Features

- `/send` - Send an email
- `/check` - Check if email is suppressed
- `/usage` - View account usage
- `/ping` - Test API connection

## Setup

### 1. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to "Bot" → "Add Bot"
4. Copy the token
5. Enable "Message Content Intent" if needed

### 2. Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Select permissions: `Send Messages`, `Embed Links`
4. Copy URL and open in browser to invite

### 3. Configure Environment

Create `.env` file:

```env
DISCORD_TOKEN=your-discord-bot-token
ADSMEDIA_API_KEY=your-adsmedia-api-key
```

### 4. Install & Run

```bash
pip install discord.py requests python-dotenv
python bot.py
```

## Commands

### /send

Send an email to anyone.

```
/send to:user@example.com subject:Hello! message:<h1>Hi!</h1>
```

### /check

Check if an email is suppressed.

```
/check email:user@example.com
```

### /usage

View your ADSMedia usage statistics.

```
/usage
```

### /ping

Test the API connection.

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

### Railway / Render / Fly.io

Set environment variables and deploy `bot.py`.

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Discord.py Docs](https://discordpy.readthedocs.io)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

