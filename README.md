<p align="center">
  <img src="https://www.adsmedia.ai/logoBig.png" alt="ADSMedia Logo" width="300">
</p>

<h1 align="center">ADSMedia Integrations</h1>

<p align="center">
  <strong>Official integrations for ADSMedia Email API</strong><br>
  Send transactional and marketing emails from your favorite platforms
</p>

<p align="center">
  <a href="https://www.adsmedia.ai/api-docs"><img src="https://img.shields.io/badge/API-Documentation-blue?style=for-the-badge" alt="API Docs"></a>
  <a href="https://github.com/ADSMedia-ai/ADSMedia/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License"></a>
  <a href="https://www.adsmedia.ai"><img src="https://img.shields.io/badge/Website-adsmedia.ai-orange?style=for-the-badge" alt="Website"></a>
</p>

---

## 📦 Available Integrations

| Integration | Type | Status | Description |
|-------------|------|--------|-------------|
| [npm SDK](#-npm-sdk) | SDK | ✅ Ready | JavaScript/TypeScript SDK |
| [Python SDK](#-python-sdk) | SDK | ✅ Ready | Python SDK |
| [WordPress](#-wordpress-plugin) | Plugin | ✅ Ready | Replace wp_mail() with ADSMedia API |
| [WooCommerce](#-woocommerce-plugin) | Plugin | ✅ Ready | Send order emails via ADSMedia |
| [n8n](#-n8n-community-node) | Community Node | ✅ Ready | Automate email workflows |
| [Cursor IDE](#-cursor-ide-mcp) | MCP | ✅ Ready | AI-powered email sending |
| [Pipedream](#-pipedream) | iPaaS | ✅ Ready | Workflow automation |
| [Activepieces](#-activepieces) | iPaaS | ✅ Ready | Open-source automation |
| [GitHub Action](#-github-action) | CI/CD | ✅ Ready | Send emails from workflows |
| [Google Sheets](#-google-sheets) | Apps Script | ✅ Ready | Send from spreadsheets |
| [Supabase](#-supabase) | Edge Function | ✅ Ready | Serverless email |
| [LangChain](#-langchain) | AI Tool | ✅ Ready | LLM agent tool |
| [CrewAI](#-crewai) | AI Tool | ✅ Ready | Multi-agent tool |
| [Discord](#-discord-bot) | Bot | ✅ Ready | Slash commands |
| [Telegram](#-telegram-bot) | Bot | ✅ Ready | Chat commands |
| [Dify](#-dify) | AI Tool | ✅ Ready | AI workflow tool |
| [Netlify](#-netlify-plugin) | Build Plugin | ✅ Ready | Deploy notifications |
| [Strapi](#-strapi) | CMS Plugin | ✅ Ready | Headless CMS email |
| [Medusa](#-medusa) | E-commerce | ✅ Ready | Order notifications |
| [Directus](#-directus) | CMS Extension | ✅ Ready | Headless email |
| [Payload CMS](#-payload-cms) | CMS Plugin | ✅ Ready | Headless email |
| [PHP SDK](#-php-sdk) | Packagist | ✅ Ready | composer require |
| [.NET SDK](#-net-sdk) | NuGet | ✅ Ready | dotnet add |
| [LlamaIndex](#-llamaindex) | AI Tool | ✅ Ready | LLM tool |
| [FlowiseAI](#-flowiseai) | AI Tool | ✅ Ready | Custom tool |
| [Webhook Handler](#-webhook-handler) | Generic | ✅ Ready | Multi-platform |

---

## 📦 npm SDK

Official JavaScript/TypeScript SDK for ADSMedia Email API.

### Installation

```bash
npm install @adsmedia/sdk
```

### Quick Start

```typescript
import ADSMedia from '@adsmedia/sdk';

const client = new ADSMedia({ apiKey: 'your-api-key' });

// Test connection
const ping = await client.ping();

// Send email
const result = await client.send({
  to: 'user@example.com',
  subject: 'Hello!',
  html: '<h1>Welcome!</h1>',
});
```

### Features
- ✅ Full TypeScript support
- ✅ Tree-shakeable ESM and CommonJS
- ✅ Zero dependencies
- ✅ All API endpoints covered

📁 **Path:** `SDK/npm/adsmedia-sdk/`

---

## 🐍 Python SDK

Official Python SDK for ADSMedia Email API.

### Installation

```bash
pip install adsmedia
```

### Quick Start

```python
from adsmedia import ADSMedia

client = ADSMedia(api_key='your-api-key')

# Test connection
ping = client.ping()

# Send email
result = client.send(
    to='user@example.com',
    subject='Hello!',
    html='<h1>Welcome!</h1>',
)
```

### Features
- ✅ Full API coverage
- ✅ Type hints for IDE support
- ✅ Simple, Pythonic interface
- ✅ Supports Python 3.8+

📁 **Path:** `SDK/python/adsmedia/`

---

## 🔌 WordPress Plugin

Replace WordPress default `wp_mail()` function with ADSMedia API for better deliverability and tracking.

### Features
- ✅ Automatic wp_mail() interception
- ✅ Test email functionality
- ✅ Email logging with status tracking
- ✅ Server selection
- ✅ Custom sender name

### Installation
1. Download `plugins/WP/adsmedia-email/`
2. Upload to `/wp-content/plugins/`
3. Activate in WordPress admin
4. Go to **Settings → ADSMedia Email**
5. Enter your API key

📁 **Path:** `plugins/WP/adsmedia-email/`

---

## 🛒 WooCommerce Plugin

Send all WooCommerce transactional emails through ADSMedia API.

### Features
- ✅ All WooCommerce email types supported
- ✅ Order-specific tracking
- ✅ Resend order emails
- ✅ Daily statistics dashboard
- ✅ HPOS compatible

### Supported Email Types
| Email | Description |
|-------|-------------|
| New Order | Admin notification |
| Processing | Order confirmation |
| Completed | Order shipped |
| Cancelled | Order cancelled |
| Refunded | Refund notification |
| Customer Note | Custom notes |
| Reset Password | Password recovery |
| New Account | Registration |

### Installation
1. Install WordPress ADSMedia plugin first
2. Download `plugins/WooCommerce/adsmedia-woocommerce/`
3. Upload to `/wp-content/plugins/`
4. Activate in WordPress admin
5. Go to **WooCommerce → ADSMedia**

📁 **Path:** `plugins/WooCommerce/adsmedia-woocommerce/`

---

## ⚡ n8n Community Node

Build automated email workflows with n8n's visual workflow builder.

### Features
- ✅ Send single & batch emails
- ✅ Campaign management
- ✅ List & contact management
- ✅ Schedule sending tasks
- ✅ Statistics & analytics
- ✅ Domain verification

### Resources
| Resource | Operations |
|----------|------------|
| Email | Send, Batch Send, Check Status |
| Campaign | Create, Get, List, Update, Delete |
| List | Create, Get, List, Delete, Add/Remove Contacts |
| Schedule | Create, List, Pause, Resume, Stop |
| Statistics | Overview, Campaign, Hourly, Daily, Countries, Providers, Bounces |
| Server | List, Get, Verify Domain |

### Installation

```bash
# Install globally
npm install -g n8n-nodes-adsmedia

# Or link for development
cd plugins/n8n/n8n-nodes-adsmedia
npm install
npm link
```

📁 **Path:** `plugins/n8n/n8n-nodes-adsmedia/`

---

## 🤖 Cursor IDE MCP

Use ADSMedia API directly from Cursor IDE with AI assistance via Model Context Protocol.

### Features
- ✅ Send emails with natural language
- ✅ Manage campaigns via AI
- ✅ Check statistics conversationally
- ✅ Full API access

### Installation

Add to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "adsmedia": {
      "command": "npx",
      "args": ["-y", "tsx", "path/to/MCP/cursor/src/index.ts"],
      "env": {
        "ADSMEDIA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

📁 **Path:** `MCP/cursor/`

---

## 🔄 Pipedream

Official Pipedream components for workflow automation.

### Available Actions
- **Send Email** - Single transactional email
- **Send Batch** - Up to 1000 marketing emails
- **Create Campaign** - Create email campaigns
- **Add Contacts** - Add contacts to lists
- **Get Stats** - Campaign statistics

### Setup
1. In Pipedream → **Accounts** → Connect "ADSMedia"
2. Enter your API key

📁 **Path:** `iPaaS/pipedream/adsmedia/`

---

## 🧩 Activepieces

Official Activepieces piece for open-source automation.

### Available Actions
- **Send Email** - Single transactional email
- **Send Batch** - Marketing emails with tracking
- **Create Campaign** - Create campaigns
- **Add Contacts** - Add to lists
- **Get Campaign Stats** - Statistics

📁 **Path:** `iPaaS/activepieces/pieces-adsmedia/`

---

## 🚀 GitHub Action

Send emails from GitHub Actions workflows - perfect for deployment notifications, build alerts, and release announcements.

### Usage

```yaml
- name: Send Email
  uses: ADSMedia-ai/ADSMedia/CI-CD/github-action@main
  with:
    api-key: ${{ secrets.ADSMEDIA_API_KEY }}
    to: team@example.com
    subject: 'Deployed: ${{ github.repository }}'
    html: '<h1>Deployment Complete</h1>'
```

### Inputs
- `api-key` - ADSMedia API key (required)
- `to` - Recipient email (required)
- `subject` - Email subject (required)
- `html` / `text` - Content (one required)

📁 **Path:** `CI-CD/github-action/`

---

## 📊 Google Sheets

Send emails directly from spreadsheets using Apps Script.

### Custom Functions
```
=ADSMEDIA_PING()
=ADSMEDIA_SEND(A1, B1, C1)
=ADSMEDIA_CHECK_SUPPRESSION(A1)
```

### Menu
- Send Bulk Emails (row by row)
- Send Batch Emails (personalized)
- View Usage Stats

📁 **Path:** `plugins/google-sheets/`

---

## 🦜 LangChain

LangChain tool for AI agents and LLM applications.

```python
from adsmedia_tool import get_adsmedia_tools

tools = get_adsmedia_tools()
agent = initialize_agent(tools, llm, agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION)
agent.run("Send welcome email to user@example.com")
```

📁 **Path:** `AI/langchain/`

---

## 🚢 CrewAI

Multi-agent tool for CrewAI workflows.

```python
from adsmedia_tool import get_adsmedia_tools

email_agent = Agent(role="Email Specialist", tools=get_adsmedia_tools())
```

📁 **Path:** `AI/crewai/`

---

## 🤖 Discord Bot

Send emails via Discord slash commands.

**Commands:**
- `/send to:email subject:text message:html` - Send email
- `/check email:address` - Check suppression
- `/usage` - View stats
- `/ping` - Test connection

📁 **Path:** `bots/discord/`

---

## 📱 Telegram Bot

Send emails via Telegram chat commands.

**Commands:**
- `/send` - Interactive email sending
- `/check <email>` - Check suppression
- `/usage` - View stats
- `/ping` - Test connection

📁 **Path:** `bots/telegram/`

---

## 🧠 Dify

Tool provider for Dify AI workflows and agents.

**Tools:**
- Send Email
- Check Suppression

📁 **Path:** `AI/dify/`

---

## 🌐 Netlify Plugin

Deploy notification emails on success/failure.

```toml
[[plugins]]
  package = "./netlify-plugin-adsmedia"
  [plugins.inputs]
    to = "team@example.com"
```

📁 **Path:** `serverless/netlify/netlify-plugin-adsmedia/`

---

## 🚀 Strapi

Plugin for Strapi headless CMS.

```javascript
// config/plugins.js
module.exports = {
  adsmedia: {
    enabled: true,
    config: {
      apiKey: process.env.ADSMEDIA_API_KEY,
    },
  },
};
```

```javascript
await strapi.plugin('adsmedia').service('email').send({
  to: 'user@example.com',
  subject: 'Hello!',
  html: '<h1>Welcome!</h1>',
});
```

📁 **Path:** `plugins/strapi/strapi-plugin-adsmedia/`

---

## 🛒 Medusa

Notification service for Medusa e-commerce.

**Supported events:**
- `order.placed`
- `order.shipment_created`
- `order.canceled`
- `customer.password_reset`

```javascript
// medusa-config.js
{
  resolve: 'medusa-plugin-adsmedia',
  options: {
    api_key: process.env.ADSMEDIA_API_KEY,
    from_name: 'My Store',
  },
}
```

📁 **Path:** `plugins/medusa/medusa-plugin-adsmedia/`

---

## 📂 Directus

Extension for Directus headless CMS.

```
POST /adsmedia/send
GET  /adsmedia/check?email=user@example.com
GET  /adsmedia/ping
```

📁 **Path:** `plugins/directus/directus-extension-adsmedia/`

---

## 📦 Payload CMS

Plugin for Payload CMS.

```typescript
import { getADSMediaService } from 'payload-plugin-adsmedia';

const adsmedia = getADSMediaService();
await adsmedia.send({ to, subject, html });
```

📁 **Path:** `plugins/payload-cms/payload-plugin-adsmedia/`

---

## 🐘 PHP SDK

Official PHP SDK for Packagist.

```bash
composer require adsmedia/sdk
```

```php
<?php
use ADSMedia\Client;

$client = new Client('your-api-key');
$result = $client->send([
    'to' => 'user@example.com',
    'subject' => 'Hello!',
    'html' => '<h1>Welcome!</h1>',
]);
```

📁 **Path:** `SDK/php/adsmedia-php/`

---

## 💜 .NET SDK

Official .NET SDK for NuGet.

```bash
dotnet add package ADSMedia.SDK
```

```csharp
var client = new ADSMediaClient("your-api-key");
var result = await client.SendAsync(new SendEmailRequest
{
    To = "user@example.com",
    Subject = "Hello!",
    Html = "<h1>Welcome!</h1>",
});
```

📁 **Path:** `SDK/dotnet/ADSMedia.SDK/`

---

## 🦙 LlamaIndex

LlamaIndex tools for AI agents.

```python
from adsmedia_tool import get_adsmedia_tools
tools = get_adsmedia_tools()
agent = ReActAgent.from_tools(tools, llm=llm)
```

📁 **Path:** `AI/llamaindex/`

---

## 🌊 FlowiseAI

Custom tool for FlowiseAI.

Import `adsmedia-tool.json` into FlowiseAI.

📁 **Path:** `AI/flowise/`

---

## 🔗 Webhook Handler

Generic webhook handler for multiple platforms.

Supports: Tally, Gumroad, Lemon Squeezy, Cal.com, Acuity, etc.

📁 **Path:** `webhooks/generic/`

---

## 🔑 Getting Your API Key

1. Go to [adsmedia.ai](https://www.adsmedia.ai)
2. Sign up or log in
3. Navigate to **Account → API Keys**
4. Create a new API key
5. Copy and use in your integration

---

## 📚 API Documentation

Full API documentation available at: **[adsmedia.ai/api-docs](https://www.adsmedia.ai/api-docs)**

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/send` | POST | Send single email |
| `/v1/send/batch` | POST | Send batch (max 1000) |
| `/v1/campaigns` | GET/POST | Manage campaigns |
| `/v1/lists` | GET/POST | Manage contact lists |
| `/v1/schedules` | GET/POST | Manage sending tasks |
| `/v1/stats/*` | GET | Get statistics |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

- 📧 Email: support@adsmedia.ai
- 🌐 Website: [adsmedia.ai](https://www.adsmedia.ai)
- 📖 Docs: [adsmedia.ai/api-docs](https://www.adsmedia.ai/api-docs)

---

<p align="center">
  Made with ❤️ by <a href="https://www.adsmedia.ai">ADSMedia</a>
</p>

