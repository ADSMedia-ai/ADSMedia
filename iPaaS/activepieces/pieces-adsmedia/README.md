# ADSMedia Activepieces Piece

Official Activepieces piece for ADSMedia Email API.

## Overview

This piece allows you to integrate ADSMedia email sending into your Activepieces workflows.

## Available Actions

| Action | Description |
|--------|-------------|
| **Send Email** | Send a single transactional email |
| **Send Batch** | Send up to 1000 marketing emails with tracking |
| **Create Campaign** | Create a new email campaign |
| **Add Contacts** | Add contacts to a list |
| **Get Campaign Stats** | Get campaign statistics |

## Setup

1. Get your API key from [adsmedia.ai](https://www.adsmedia.ai)
2. In Activepieces, add ADSMedia connection
3. Paste your API key

## Usage Examples

### Send Welcome Email

Use the "Send Email" action:
- **To Email**: `{{trigger.email}}`
- **Subject**: `Welcome to our service!`
- **HTML Content**: `<h1>Welcome!</h1><p>Thanks for signing up.</p>`

### Send Marketing Campaign

Use the "Send Batch" action:
- **Recipients**: Array of `{email, name}` objects
- **Subject**: `Hello %%First Name%%!`
- **HTML Content**: `<h1>Hi %%First Name%%!</h1>`

## Personalization Placeholders

Use in subject and HTML:

| Placeholder | Description |
|-------------|-------------|
| `%%First Name%%` | Recipient's first name |
| `%%Last Name%%` | Recipient's last name |
| `%%emailaddress%%` | Recipient's email |
| `%%unsubscribelink%%` | Unsubscribe URL |
| `%%webversion%%` | View in browser link |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Activepieces](https://www.activepieces.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

