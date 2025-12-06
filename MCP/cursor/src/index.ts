#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE_URL = "https://api.adsmedia.live/v1";
const API_KEY = process.env.ADSMEDIA_API_KEY || "";

// Helper function for API requests
async function apiRequest(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<unknown> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT" || method === "DELETE")) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`API Error: ${JSON.stringify(data)}`);
  }
  
  return data;
}

// Define all tools
const tools: Tool[] = [
  // ===== Authentication =====
  {
    name: "adsmedia_ping",
    description: "Test API connectivity and authentication",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },

  // ===== Send Email =====
  {
    name: "adsmedia_send_email",
    description: "Send a single transactional email synchronously. No tracking/statistics. Use for password resets, order confirmations, notifications.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address (required)" },
        to_name: { type: "string", description: "Recipient name (optional)" },
        subject: { type: "string", description: "Email subject line (required)" },
        html: { type: "string", description: "HTML content (required unless text-only)" },
        text: { type: "string", description: "Plain text version (auto-generated from HTML if not provided)" },
        type: { type: "integer", description: "1=HTML+text (default), 2=HTML only, 3=text only" },
        from_name: { type: "string", description: "Sender display name" },
        reply_to: { type: "string", description: "Reply-to email address" },
        server_id: { type: "integer", description: "Specific server ID" },
        unsubscribe_url: { type: "string", description: "URL for List-Unsubscribe header" },
      },
      required: ["to", "subject"],
    },
  },
  {
    name: "adsmedia_send_batch",
    description: "Send up to 1000 marketing emails in a batch. Creates an async task with full tracking (opens, clicks, unsubscribes).",
    inputSchema: {
      type: "object",
      properties: {
        recipients: {
          type: "array",
          description: "Array of recipients (max 1000). Each: {email: string, name?: string}",
          items: {
            type: "object",
            properties: {
              email: { type: "string" },
              name: { type: "string" },
            },
            required: ["email"],
          },
        },
        subject: { type: "string", description: "Email subject line. Supports %%First Name%%, %%Last Name%%, %%emailaddress%%" },
        html: { type: "string", description: "HTML content. Supports personalization placeholders." },
        text: { type: "string", description: "Plain text version (optional)" },
        preheader: { type: "string", description: "Email preheader/preview text" },
        from_name: { type: "string", description: "Sender display name" },
        server_id: { type: "integer", description: "Specific server ID" },
      },
      required: ["recipients", "subject", "html"],
    },
  },
  {
    name: "adsmedia_send_status",
    description: "Get the status of a sent email by message ID or send ID",
    inputSchema: {
      type: "object",
      properties: {
        message_id: { type: "string", description: "Message ID returned from /send" },
        id: { type: "integer", description: "Send ID returned from /send" },
      },
      required: [],
    },
  },

  // ===== Campaigns =====
  {
    name: "adsmedia_list_campaigns",
    description: "List all email campaigns",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Max results (default: 50)" },
      },
      required: [],
    },
  },
  {
    name: "adsmedia_get_campaign",
    description: "Get a specific campaign by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Campaign ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "adsmedia_create_campaign",
    description: "Create a new email campaign",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Campaign name" },
        subject: { type: "string", description: "Email subject line" },
        html: { type: "string", description: "HTML content" },
        text: { type: "string", description: "Plain text version" },
        preheader: { type: "string", description: "Preheader text" },
        type: { type: "integer", description: "1=HTML+text (default), 2=HTML only, 3=text only" },
      },
      required: ["name", "subject", "html"],
    },
  },
  {
    name: "adsmedia_update_campaign",
    description: "Update an existing campaign. Only provided fields will be updated.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Campaign ID" },
        name: { type: "string", description: "Campaign name" },
        subject: { type: "string", description: "Email subject line" },
        html: { type: "string", description: "HTML content" },
        text: { type: "string", description: "Plain text version" },
        preheader: { type: "string", description: "Preheader text" },
        type: { type: "integer", description: "1=HTML+text, 2=HTML only, 3=text only" },
      },
      required: ["id"],
    },
  },
  {
    name: "adsmedia_delete_campaign",
    description: "Delete a campaign (soft delete)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Campaign ID" },
      },
      required: ["id"],
    },
  },

  // ===== Lists & Contacts =====
  {
    name: "adsmedia_list_lists",
    description: "List all subscriber lists",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adsmedia_create_list",
    description: "Create a new subscriber list",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "List name" },
        type: { type: "integer", description: "1=email (default), 3=phone" },
      },
      required: ["name"],
    },
  },
  {
    name: "adsmedia_get_contacts",
    description: "Get contacts from a list",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "List ID" },
        limit: { type: "integer", description: "Max results (default: 100, max: 1000)" },
        offset: { type: "integer", description: "Pagination offset" },
      },
      required: ["id"],
    },
  },
  {
    name: "adsmedia_add_contacts",
    description: "Add contacts to a list (max 1000 per request)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "List ID" },
        contacts: {
          type: "array",
          description: "Array of contacts: {email, firstName?, lastName?, custom1?, custom2?}",
          items: {
            type: "object",
            properties: {
              email: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              custom1: { type: "string" },
              custom2: { type: "string" },
            },
            required: ["email"],
          },
        },
      },
      required: ["id", "contacts"],
    },
  },
  {
    name: "adsmedia_delete_contacts",
    description: "Remove contacts from a list",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "List ID" },
        emails: {
          type: "array",
          description: "Array of email addresses to remove",
          items: { type: "string" },
        },
      },
      required: ["id", "emails"],
    },
  },
  {
    name: "adsmedia_split_list",
    description: "Split a large list into smaller chunks. Lists over 150k contacts must be split before sending. Creates child lists under the parent.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "List ID to split" },
        max_size: { type: "integer", description: "Maximum contacts per split (default: 35000, max: 150000)" },
      },
      required: ["id"],
    },
  },

  // ===== Schedules =====
  {
    name: "adsmedia_list_schedules",
    description: "List all schedules/sending tasks",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter: queue, prep, sending, done, paused" },
      },
      required: [],
    },
  },
  {
    name: "adsmedia_create_schedule",
    description: "Create a new sending task",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: { type: "integer", description: "Campaign ID" },
        list_id: { type: "integer", description: "List ID" },
        server_id: { type: "integer", description: "Server ID" },
        sender_name: { type: "string", description: "Sender display name" },
        schedule: { type: "string", description: "Schedule datetime (YYYY-MM-DD HH:MM:SS)" },
      },
      required: ["campaign_id", "list_id", "server_id"],
    },
  },
  {
    name: "adsmedia_pause_schedule",
    description: "Pause an active schedule",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Schedule ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "adsmedia_resume_schedule",
    description: "Resume a paused schedule",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Schedule ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "adsmedia_update_schedule",
    description: "Update schedule sender name or datetime. Cannot edit if status is 'sending' or 'done'.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Schedule ID" },
        sender_name: { type: "string", description: "New sender display name" },
        schedule: { type: "string", description: "New datetime (YYYY-MM-DD HH:MM:SS)" },
      },
      required: ["id"],
    },
  },
  {
    name: "adsmedia_stop_schedule",
    description: "Stop and delete a schedule permanently",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Schedule ID" },
      },
      required: ["id"],
    },
  },

  // ===== Servers =====
  {
    name: "adsmedia_list_servers",
    description: "List all sending servers with status, limits, and warmup progress",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adsmedia_get_server",
    description: "Get detailed information about a specific server",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Server ID" },
      },
      required: ["id"],
    },
  },

  // ===== Domain Verification =====
  {
    name: "adsmedia_verify_domain",
    description: "Comprehensive DNS verification (SPF, DKIM, DMARC, MX, PTR, DNSSEC, TLSA)",
    inputSchema: {
      type: "object",
      properties: {
        server_id: { type: "integer", description: "Server ID" },
      },
      required: ["server_id"],
    },
  },

  // ===== Statistics =====
  {
    name: "adsmedia_stats_overview",
    description: "Get overall sending statistics across all campaigns",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adsmedia_stats_campaign",
    description: "Get statistics for a specific campaign/task",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Task/Campaign ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "adsmedia_stats_hourly",
    description: "Get hourly breakdown of opens/clicks for a task",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Task ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "adsmedia_stats_daily",
    description: "Get daily breakdown of opens/clicks for a task",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Task ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "adsmedia_stats_countries",
    description: "Get geographic distribution of opens/clicks",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Task ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "adsmedia_stats_bounces",
    description: "Get bounce details grouped by reason",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Task ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "adsmedia_stats_providers",
    description: "Get statistics by email provider (Gmail, Outlook, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Task ID" },
      },
      required: ["id"],
    },
  },

  // ===== Events =====
  {
    name: "adsmedia_get_events",
    description: "Get detailed events (opens, clicks, bounces, unsubscribes) for a task",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Task/Schedule ID" },
        type: { type: "string", description: "Filter: open, click, bounce, unsubscribe, sent" },
        email: { type: "string", description: "Filter by specific email" },
        limit: { type: "integer", description: "Max results (default: 100, max: 1000)" },
        offset: { type: "integer", description: "Pagination offset" },
      },
      required: ["id"],
    },
  },

  // ===== Suppressions =====
  {
    name: "adsmedia_check_suppression",
    description: "Check if an email is suppressed (bounced, unsubscribed, or blocked)",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Email address to check" },
      },
      required: ["email"],
    },
  },

  // ===== Account =====
  {
    name: "adsmedia_get_account",
    description: "Get account information",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adsmedia_get_usage",
    description: "Get usage statistics and limits (servers, lists, subscribers, sending stats)",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adsmedia_get_api_keys",
    description: "Get your current API key",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "adsmedia_regenerate_api_key",
    description: "Generate a new API key. WARNING: This invalidates your current key immediately!",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// Tool handler
async function handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    let result: unknown;

    switch (name) {
      // Authentication
      case "adsmedia_ping":
        result = await apiRequest("/ping");
        break;

      // Send Email
      case "adsmedia_send_email":
        result = await apiRequest("/send", "POST", args);
        break;
      case "adsmedia_send_batch":
        result = await apiRequest("/send/batch", "POST", args);
        break;
      case "adsmedia_send_status": {
        const params = new URLSearchParams();
        if (args.message_id) params.append("message_id", String(args.message_id));
        if (args.id) params.append("id", String(args.id));
        result = await apiRequest(`/send/status?${params.toString()}`);
        break;
      }

      // Campaigns
      case "adsmedia_list_campaigns": {
        const params = args.limit ? `?limit=${args.limit}` : "";
        result = await apiRequest(`/campaigns${params}`);
        break;
      }
      case "adsmedia_get_campaign":
        result = await apiRequest(`/campaigns/get?id=${args.id}`);
        break;
      case "adsmedia_create_campaign":
        result = await apiRequest("/campaigns/create", "POST", args);
        break;
      case "adsmedia_update_campaign": {
        const { id, ...body } = args;
        result = await apiRequest(`/campaigns/update?id=${id}`, "POST", body);
        break;
      }
      case "adsmedia_delete_campaign":
        result = await apiRequest(`/campaigns/delete?id=${args.id}`, "DELETE");
        break;

      // Lists & Contacts
      case "adsmedia_list_lists":
        result = await apiRequest("/lists");
        break;
      case "adsmedia_create_list":
        result = await apiRequest("/lists/create", "POST", args);
        break;
      case "adsmedia_get_contacts": {
        const params = new URLSearchParams({ id: String(args.id) });
        if (args.limit) params.append("limit", String(args.limit));
        if (args.offset) params.append("offset", String(args.offset));
        result = await apiRequest(`/lists/contacts?${params.toString()}`);
        break;
      }
      case "adsmedia_add_contacts": {
        const { id, contacts } = args;
        result = await apiRequest(`/lists/contacts/add?id=${id}`, "POST", { contacts });
        break;
      }
      case "adsmedia_delete_contacts": {
        const { id, emails } = args;
        result = await apiRequest(`/lists/contacts/delete?id=${id}`, "DELETE", { emails });
        break;
      }
      case "adsmedia_split_list": {
        const { id, max_size } = args;
        const body: Record<string, unknown> = {};
        if (max_size) body.max_size = max_size;
        result = await apiRequest(`/lists/split?id=${id}`, "POST", body);
        break;
      }

      // Schedules
      case "adsmedia_list_schedules": {
        const params = args.status ? `?status=${args.status}` : "";
        result = await apiRequest(`/schedules${params}`);
        break;
      }
      case "adsmedia_create_schedule":
        result = await apiRequest("/schedules/create", "POST", args);
        break;
      case "adsmedia_pause_schedule":
        result = await apiRequest(`/schedules/pause?id=${args.id}`, "POST");
        break;
      case "adsmedia_resume_schedule":
        result = await apiRequest(`/schedules/resume?id=${args.id}`, "POST");
        break;
      case "adsmedia_update_schedule": {
        const { id, ...body } = args;
        result = await apiRequest(`/schedules/update?id=${id}`, "PUT", body);
        break;
      }
      case "adsmedia_stop_schedule":
        result = await apiRequest(`/schedules/stop?id=${args.id}`, "DELETE");
        break;

      // Servers
      case "adsmedia_list_servers":
        result = await apiRequest("/servers");
        break;
      case "adsmedia_get_server":
        result = await apiRequest(`/servers/get?id=${args.id}`);
        break;

      // Domain Verification
      case "adsmedia_verify_domain":
        result = await apiRequest(`/domains/verify?server_id=${args.server_id}`);
        break;

      // Statistics
      case "adsmedia_stats_overview":
        result = await apiRequest("/stats/overview");
        break;
      case "adsmedia_stats_campaign":
        result = await apiRequest(`/stats/campaign?id=${args.id}`);
        break;
      case "adsmedia_stats_hourly":
        result = await apiRequest(`/stats/hourly?id=${args.id}`);
        break;
      case "adsmedia_stats_daily":
        result = await apiRequest(`/stats/daily?id=${args.id}`);
        break;
      case "adsmedia_stats_countries":
        result = await apiRequest(`/stats/countries?id=${args.id}`);
        break;
      case "adsmedia_stats_bounces":
        result = await apiRequest(`/stats/bounces?id=${args.id}`);
        break;
      case "adsmedia_stats_providers":
        result = await apiRequest(`/stats/providers?id=${args.id}`);
        break;

      // Events
      case "adsmedia_get_events": {
        const params = new URLSearchParams({ id: String(args.id) });
        if (args.type) params.append("type", String(args.type));
        if (args.email) params.append("email", String(args.email));
        if (args.limit) params.append("limit", String(args.limit));
        if (args.offset) params.append("offset", String(args.offset));
        result = await apiRequest(`/stats/events?${params.toString()}`);
        break;
      }

      // Suppressions
      case "adsmedia_check_suppression":
        result = await apiRequest(`/suppressions/check?email=${encodeURIComponent(String(args.email))}`);
        break;

      // Account
      case "adsmedia_get_account":
        result = await apiRequest("/account");
        break;
      case "adsmedia_get_usage":
        result = await apiRequest("/account/usage");
        break;
      case "adsmedia_get_api_keys":
        result = await apiRequest("/account/api-keys");
        break;
      case "adsmedia_regenerate_api_key":
        result = await apiRequest("/account/api-keys/regenerate", "POST");
        break;

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }

    return JSON.stringify(result, null, 2);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return JSON.stringify({ error: errorMessage });
  }
}

// Create and run the server
async function main() {
  const server = new Server(
    {
      name: "adsmedia-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await handleToolCall(name, (args as Record<string, unknown>) || {});
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ADSMedia MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

