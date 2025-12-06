# ADSMedia Connector for Automatisch

Open-source Zapier alternative integration for ADSMedia.

## Installation

1. Copy `adsmedia-connector` to Automatisch apps directory
2. Register the connector
3. Restart Automatisch

## Authentication

Enter your ADSMedia API key when connecting.

## Actions

### Send Email

Send a single transactional email.

**Parameters:**
- To (required): Recipient email
- Subject (required): Email subject
- HTML Content (required): Email body
- To Name: Recipient name
- From Name: Sender display name

### Send Batch Emails

Send marketing emails to multiple recipients.

**Parameters:**
- Recipients (JSON array): `[{"email": "...", "name": "..."}]`
- Subject: Use `%%First Name%%` for personalization
- HTML Content: Email body
- Preheader: Preview text
- From Name: Sender name

### Check Suppression

Check if email is suppressed before sending.

**Parameters:**
- Email: Address to check

### Add Contacts to List

Add contacts to a mailing list.

**Parameters:**
- List ID: Target list
- Contacts (JSON): Array of contacts

## Example Flow

1. Trigger: New form submission
2. Action: Check Suppression
3. Filter: If not suppressed
4. Action: Send Email

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [Automatisch Docs](https://docs.automatisch.io)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

