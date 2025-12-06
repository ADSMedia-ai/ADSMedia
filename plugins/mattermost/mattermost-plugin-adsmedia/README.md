# Mattermost Plugin - ADSMedia Email

Send emails via ADSMedia API from Mattermost.

## Features

- `/email` slash command
- Send emails to anyone from chat
- Ephemeral responses (private to sender)

## Installation

1. Download the plugin bundle
2. Go to System Console → Plugins → Upload Plugin
3. Upload the bundle
4. Enable the plugin
5. Configure API key

## Configuration

1. System Console → Plugins → ADSMedia Email
2. Set your API key
3. Set default sender name (optional)

## Usage

```
/email user@example.com "Subject Here" "Your message here"
```

### Examples

```
/email john@example.com "Meeting Reminder" "Don't forget our meeting at 3pm!"
```

```
/email team@company.com "Weekly Update" "The project is on track."
```

## Build from Source

```bash
cd server
go build -o dist/plugin main.go
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Mattermost Plugins](https://developers.mattermost.com/integrate/plugins)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

