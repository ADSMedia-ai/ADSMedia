# n8n-nodes-adsmedia

This is an n8n community node for [ADSMedia Email API](https://adsmedia.ai).

Send transactional and marketing emails via ADSMedia API directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### npm

```bash
npm install n8n-nodes-adsmedia
```

### n8n GUI

1. Go to **Settings** → **Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-adsmedia`
4. Click **Install**

## Credentials

You need an ADSMedia API key to use this node:

1. Sign up at [adsmedia.ai](https://adsmedia.ai)
2. Go to your dashboard → API Keys
3. Copy your API key
4. In n8n, create new credentials of type **ADSMedia API**
5. Paste your API key

## Operations

### Email
- **Send Single** - Send a single transactional email (no tracking)
- **Send Batch** - Send up to 1000 marketing emails with tracking
- **Get Status** - Check email delivery status
- **Check Suppression** - Check if an email is suppressed (bounced/unsubscribed)

### Campaign
- **Get All** - List all campaigns
- **Get** - Get a specific campaign
- **Create** - Create a new email campaign
- **Update** - Update an existing campaign
- **Delete** - Delete a campaign

### List
- **Get All** - List all subscriber lists
- **Create** - Create a new list
- **Split** - Split a large list into smaller ones (max 150k per split)

### Contact
- **Get All** - Get contacts from a list
- **Add** - Add contacts to a list (max 1000 per request)
- **Delete** - Remove contacts from a list

### Schedule
- **Get All** - List all sending tasks
- **Create** - Create a new sending schedule
- **Update** - Update schedule time or sender name
- **Pause** - Pause an active schedule
- **Resume** - Resume a paused schedule
- **Stop** - Stop and delete a schedule

### Statistics
- **Overview** - Get overall sending statistics
- **Campaign Stats** - Get stats for a specific task
- **Hourly** - Get hourly breakdown
- **Daily** - Get daily breakdown
- **Countries** - Get geographic distribution
- **Bounces** - Get bounce details by reason
- **Providers** - Get stats by email provider
- **Events** - Get detailed events (opens, clicks, bounces, etc.)

### Server
- **Get All** - List all sending servers
- **Get** - Get server details with warmup progress
- **Verify Domain** - Run comprehensive DNS verification (SPF, DKIM, DMARC, MX, PTR)

### Account
- **Get Info** - Get account information
- **Get Usage** - Get usage statistics and limits
- **Get API Keys** - Get current API key info

## Personalization

In batch emails, you can use these placeholders:

| Placeholder | Description |
|------------|-------------|
| `%%First Name%%` | Recipient first name |
| `%%Last Name%%` | Recipient last name |
| `%%emailaddress%%` | Recipient email |
| `%%Sender Name%%` | Sender display name |
| `%%unsubscribelink%%` | Unsubscribe URL |
| `%%webversion%%` | View in browser link |

## Example Workflow

```json
{
  "nodes": [
    {
      "name": "ADSMedia",
      "type": "n8n-nodes-adsmedia.adsMedia",
      "parameters": {
        "resource": "email",
        "operation": "sendSingle",
        "to": "user@example.com",
        "subject": "Welcome!",
        "html": "<h1>Hello!</h1><p>Welcome to our service.</p>"
      }
    }
  ]
}
```

## Resources

- [ADSMedia Website](https://adsmedia.ai)
- [API Documentation](https://adsmedia.ai/api-docs)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE.md)


