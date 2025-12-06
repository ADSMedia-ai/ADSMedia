import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class ADSMedia implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ADSMedia',
		name: 'adsMedia',
		icon: 'file:adsmedia.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send emails via ADSMedia API',
		defaults: {
			name: 'ADSMedia',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'adsMediaApi',
				required: true,
			},
		],
		properties: [
			// Resource
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Email', value: 'email' },
					{ name: 'Campaign', value: 'campaign' },
					{ name: 'List', value: 'list' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Schedule', value: 'schedule' },
					{ name: 'Statistics', value: 'statistics' },
					{ name: 'Server', value: 'server' },
					{ name: 'Account', value: 'account' },
				],
				default: 'email',
			},

			// ============ EMAIL OPERATIONS ============
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['email'] } },
				options: [
					{ name: 'Send Single', value: 'sendSingle', description: 'Send a single transactional email', action: 'Send single email' },
					{ name: 'Send Batch', value: 'sendBatch', description: 'Send batch marketing emails (up to 1000)', action: 'Send batch emails' },
					{ name: 'Get Status', value: 'getStatus', description: 'Get email delivery status', action: 'Get email status' },
					{ name: 'Check Suppression', value: 'checkSuppression', description: 'Check if email is suppressed', action: 'Check suppression' },
				],
				default: 'sendSingle',
			},

			// Send Single Email Fields
			{
				displayName: 'To Email',
				name: 'to',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['email'], operation: ['sendSingle'] } },
				description: 'Recipient email address',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['email'], operation: ['sendSingle'] } },
				description: 'Email subject line',
			},
			{
				displayName: 'HTML Content',
				name: 'html',
				type: 'string',
				typeOptions: { rows: 10 },
				default: '',
				required: true,
				displayOptions: { show: { resource: ['email'], operation: ['sendSingle'] } },
				description: 'HTML content of the email',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['email'], operation: ['sendSingle'] } },
				options: [
					{ displayName: 'To Name', name: 'to_name', type: 'string', default: '', description: 'Recipient name' },
					{ displayName: 'From Name', name: 'from_name', type: 'string', default: '', description: 'Sender display name' },
					{ displayName: 'Reply To', name: 'reply_to', type: 'string', default: '', description: 'Reply-to email address' },
					{ displayName: 'Text Content', name: 'text', type: 'string', default: '', description: 'Plain text version' },
					{ displayName: 'Server ID', name: 'server_id', type: 'number', default: 0, description: 'Specific server ID' },
					{ displayName: 'Unsubscribe URL', name: 'unsubscribe_url', type: 'string', default: '', description: 'Custom unsubscribe URL' },
				],
			},

			// Send Batch Email Fields
			{
				displayName: 'Recipients',
				name: 'recipients',
				type: 'json',
				default: '[{"email": "user@example.com", "name": "John"}]',
				required: true,
				displayOptions: { show: { resource: ['email'], operation: ['sendBatch'] } },
				description: 'Array of recipients (max 1000). Each: {email: string, name?: string}',
			},
			{
				displayName: 'Subject',
				name: 'batchSubject',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['email'], operation: ['sendBatch'] } },
				description: 'Email subject. Supports %%First Name%%, %%Last Name%%, %%emailaddress%%',
			},
			{
				displayName: 'HTML Content',
				name: 'batchHtml',
				type: 'string',
				typeOptions: { rows: 10 },
				default: '',
				required: true,
				displayOptions: { show: { resource: ['email'], operation: ['sendBatch'] } },
				description: 'HTML content. Supports personalization placeholders.',
			},
			{
				displayName: 'Batch Options',
				name: 'batchOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['email'], operation: ['sendBatch'] } },
				options: [
					{ displayName: 'From Name', name: 'from_name', type: 'string', default: '', description: 'Sender display name' },
					{ displayName: 'Preheader', name: 'preheader', type: 'string', default: '', description: 'Email preheader/preview text' },
					{ displayName: 'Text Content', name: 'text', type: 'string', default: '', description: 'Plain text version' },
					{ displayName: 'Server ID', name: 'server_id', type: 'number', default: 0, description: 'Specific server ID' },
				],
			},

			// Get Status Fields
			{
				displayName: 'Lookup By',
				name: 'statusLookup',
				type: 'options',
				default: 'messageId',
				displayOptions: { show: { resource: ['email'], operation: ['getStatus'] } },
				options: [
					{ name: 'Message ID', value: 'messageId' },
					{ name: 'Send ID', value: 'sendId' },
				],
			},
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['email'], operation: ['getStatus'], statusLookup: ['messageId'] } },
				description: 'Message ID returned from send',
			},
			{
				displayName: 'Send ID',
				name: 'sendId',
				type: 'number',
				default: 0,
				displayOptions: { show: { resource: ['email'], operation: ['getStatus'], statusLookup: ['sendId'] } },
				description: 'Send ID returned from send',
			},

			// Check Suppression
			{
				displayName: 'Email to Check',
				name: 'suppressionEmail',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['email'], operation: ['checkSuppression'] } },
				description: 'Email address to check for suppression',
			},

			// ============ CAMPAIGN OPERATIONS ============
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['campaign'] } },
				options: [
					{ name: 'Get All', value: 'getAll', description: 'Get all campaigns', action: 'Get all campaigns' },
					{ name: 'Get', value: 'get', description: 'Get a campaign by ID', action: 'Get campaign' },
					{ name: 'Create', value: 'create', description: 'Create a new campaign', action: 'Create campaign' },
					{ name: 'Update', value: 'update', description: 'Update a campaign', action: 'Update campaign' },
					{ name: 'Delete', value: 'delete', description: 'Delete a campaign', action: 'Delete campaign' },
				],
				default: 'getAll',
			},

			// Campaign Get All
			{
				displayName: 'Limit',
				name: 'campaignLimit',
				type: 'number',
				default: 50,
				displayOptions: { show: { resource: ['campaign'], operation: ['getAll'] } },
				description: 'Max results to return',
			},

			// Campaign Get/Update/Delete
			{
				displayName: 'Campaign ID',
				name: 'campaignId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['campaign'], operation: ['get', 'update', 'delete'] } },
				description: 'Campaign ID',
			},

			// Campaign Create/Update Fields
			{
				displayName: 'Name',
				name: 'campaignName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['campaign'], operation: ['create'] } },
				description: 'Campaign name',
			},
			{
				displayName: 'Subject',
				name: 'campaignSubject',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['campaign'], operation: ['create'] } },
				description: 'Email subject line',
			},
			{
				displayName: 'HTML Content',
				name: 'campaignHtml',
				type: 'string',
				typeOptions: { rows: 10 },
				default: '',
				required: true,
				displayOptions: { show: { resource: ['campaign'], operation: ['create'] } },
				description: 'HTML content',
			},
			{
				displayName: 'Campaign Options',
				name: 'campaignOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['campaign'], operation: ['create', 'update'] } },
				options: [
					{ displayName: 'Name', name: 'name', type: 'string', default: '', description: 'Campaign name (for update)' },
					{ displayName: 'Subject', name: 'subject', type: 'string', default: '', description: 'Email subject (for update)' },
					{ displayName: 'HTML', name: 'html', type: 'string', default: '', description: 'HTML content (for update)' },
					{ displayName: 'Text', name: 'text', type: 'string', default: '', description: 'Plain text version' },
					{ displayName: 'Preheader', name: 'preheader', type: 'string', default: '', description: 'Preheader text' },
					{ displayName: 'Type', name: 'type', type: 'options', options: [
						{ name: 'HTML + Text', value: 1 },
						{ name: 'HTML Only', value: 2 },
						{ name: 'Text Only', value: 3 },
					], default: 1, description: 'Email type' },
				],
			},

			// ============ LIST OPERATIONS ============
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['list'] } },
				options: [
					{ name: 'Get All', value: 'getAll', description: 'Get all lists', action: 'Get all lists' },
					{ name: 'Create', value: 'create', description: 'Create a new list', action: 'Create list' },
					{ name: 'Split', value: 'split', description: 'Split a large list into smaller ones', action: 'Split list' },
				],
				default: 'getAll',
			},

			// List Create
			{
				displayName: 'List Name',
				name: 'listName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['list'], operation: ['create'] } },
				description: 'Name for the new list',
			},
			{
				displayName: 'List Type',
				name: 'listType',
				type: 'options',
				default: 1,
				displayOptions: { show: { resource: ['list'], operation: ['create'] } },
				options: [
					{ name: 'Email', value: 1 },
					{ name: 'Phone', value: 3 },
				],
			},

			// List Split
			{
				displayName: 'List ID',
				name: 'splitListId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['list'], operation: ['split'] } },
				description: 'List ID to split',
			},
			{
				displayName: 'Max Size',
				name: 'splitMaxSize',
				type: 'number',
				default: 35000,
				displayOptions: { show: { resource: ['list'], operation: ['split'] } },
				description: 'Maximum contacts per split (max 150000)',
			},

			// ============ CONTACT OPERATIONS ============
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['contact'] } },
				options: [
					{ name: 'Get All', value: 'getAll', description: 'Get contacts from a list', action: 'Get contacts' },
					{ name: 'Add', value: 'add', description: 'Add contacts to a list', action: 'Add contacts' },
					{ name: 'Delete', value: 'delete', description: 'Remove contacts from a list', action: 'Delete contacts' },
				],
				default: 'getAll',
			},

			// Contact List ID (for all contact operations)
			{
				displayName: 'List ID',
				name: 'contactListId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['contact'] } },
				description: 'List ID',
			},

			// Contact Get All Options
			{
				displayName: 'Limit',
				name: 'contactLimit',
				type: 'number',
				default: 100,
				displayOptions: { show: { resource: ['contact'], operation: ['getAll'] } },
				description: 'Max results (max 1000)',
			},
			{
				displayName: 'Offset',
				name: 'contactOffset',
				type: 'number',
				default: 0,
				displayOptions: { show: { resource: ['contact'], operation: ['getAll'] } },
				description: 'Pagination offset',
			},

			// Contact Add
			{
				displayName: 'Contacts',
				name: 'contactsToAdd',
				type: 'json',
				default: '[{"email": "user@example.com", "firstName": "John", "lastName": "Doe"}]',
				required: true,
				displayOptions: { show: { resource: ['contact'], operation: ['add'] } },
				description: 'Array of contacts (max 1000). Each: {email, firstName?, lastName?, custom1?, custom2?}',
			},

			// Contact Delete
			{
				displayName: 'Emails to Remove',
				name: 'contactsToDelete',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['contact'], operation: ['delete'] } },
				description: 'Comma-separated email addresses to remove',
			},

			// ============ SCHEDULE OPERATIONS ============
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['schedule'] } },
				options: [
					{ name: 'Get All', value: 'getAll', description: 'Get all schedules', action: 'Get all schedules' },
					{ name: 'Create', value: 'create', description: 'Create a sending task', action: 'Create schedule' },
					{ name: 'Update', value: 'update', description: 'Update a schedule', action: 'Update schedule' },
					{ name: 'Pause', value: 'pause', description: 'Pause a schedule', action: 'Pause schedule' },
					{ name: 'Resume', value: 'resume', description: 'Resume a schedule', action: 'Resume schedule' },
					{ name: 'Stop', value: 'stop', description: 'Stop and delete a schedule', action: 'Stop schedule' },
				],
				default: 'getAll',
			},

			// Schedule Get All
			{
				displayName: 'Status Filter',
				name: 'scheduleStatus',
				type: 'options',
				default: '',
				displayOptions: { show: { resource: ['schedule'], operation: ['getAll'] } },
				options: [
					{ name: 'All', value: '' },
					{ name: 'Queue', value: 'queue' },
					{ name: 'Prep', value: 'prep' },
					{ name: 'Sending', value: 'sending' },
					{ name: 'Done', value: 'done' },
					{ name: 'Paused', value: 'paused' },
				],
			},

			// Schedule Create
			{
				displayName: 'Campaign ID',
				name: 'scheduleCampaignId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['schedule'], operation: ['create'] } },
			},
			{
				displayName: 'List ID',
				name: 'scheduleListId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['schedule'], operation: ['create'] } },
			},
			{
				displayName: 'Server ID',
				name: 'scheduleServerId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['schedule'], operation: ['create'] } },
			},
			{
				displayName: 'Schedule Options',
				name: 'scheduleOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: { show: { resource: ['schedule'], operation: ['create'] } },
				options: [
					{ displayName: 'Sender Name', name: 'sender_name', type: 'string', default: '', description: 'Sender display name' },
					{ displayName: 'Schedule Time', name: 'schedule', type: 'string', default: '', description: 'Datetime (YYYY-MM-DD HH:MM:SS)' },
				],
			},

			// Schedule Update/Pause/Resume/Stop
			{
				displayName: 'Schedule ID',
				name: 'scheduleId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['schedule'], operation: ['update', 'pause', 'resume', 'stop'] } },
			},
			{
				displayName: 'Update Fields',
				name: 'scheduleUpdateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: { show: { resource: ['schedule'], operation: ['update'] } },
				options: [
					{ displayName: 'Sender Name', name: 'sender_name', type: 'string', default: '' },
					{ displayName: 'Schedule Time', name: 'schedule', type: 'string', default: '', description: 'YYYY-MM-DD HH:MM:SS' },
				],
			},

			// ============ STATISTICS OPERATIONS ============
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['statistics'] } },
				options: [
					{ name: 'Overview', value: 'overview', description: 'Get overall stats', action: 'Get overview stats' },
					{ name: 'Campaign Stats', value: 'campaign', description: 'Get campaign stats', action: 'Get campaign stats' },
					{ name: 'Hourly', value: 'hourly', description: 'Get hourly breakdown', action: 'Get hourly stats' },
					{ name: 'Daily', value: 'daily', description: 'Get daily breakdown', action: 'Get daily stats' },
					{ name: 'Countries', value: 'countries', description: 'Get geographic stats', action: 'Get country stats' },
					{ name: 'Bounces', value: 'bounces', description: 'Get bounce details', action: 'Get bounce stats' },
					{ name: 'Providers', value: 'providers', description: 'Get provider stats', action: 'Get provider stats' },
					{ name: 'Events', value: 'events', description: 'Get detailed events', action: 'Get events' },
				],
				default: 'overview',
			},

			// Stats Task ID (for all except overview)
			{
				displayName: 'Task ID',
				name: 'statsTaskId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['statistics'], operation: ['campaign', 'hourly', 'daily', 'countries', 'bounces', 'providers', 'events'] } },
			},

			// Events Options
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				default: '',
				displayOptions: { show: { resource: ['statistics'], operation: ['events'] } },
				options: [
					{ name: 'All', value: '' },
					{ name: 'Open', value: 'open' },
					{ name: 'Click', value: 'click' },
					{ name: 'Bounce', value: 'bounce' },
					{ name: 'Unsubscribe', value: 'unsubscribe' },
					{ name: 'Sent', value: 'sent' },
				],
			},
			{
				displayName: 'Limit',
				name: 'eventsLimit',
				type: 'number',
				default: 100,
				displayOptions: { show: { resource: ['statistics'], operation: ['events'] } },
			},

			// ============ SERVER OPERATIONS ============
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['server'] } },
				options: [
					{ name: 'Get All', value: 'getAll', description: 'List all servers', action: 'Get all servers' },
					{ name: 'Get', value: 'get', description: 'Get server details', action: 'Get server' },
					{ name: 'Verify Domain', value: 'verifyDomain', description: 'Verify domain DNS', action: 'Verify domain' },
				],
				default: 'getAll',
			},

			// Server ID
			{
				displayName: 'Server ID',
				name: 'serverId',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['server'], operation: ['get', 'verifyDomain'] } },
			},

			// ============ ACCOUNT OPERATIONS ============
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['account'] } },
				options: [
					{ name: 'Get Info', value: 'getInfo', description: 'Get account information', action: 'Get account info' },
					{ name: 'Get Usage', value: 'getUsage', description: 'Get usage statistics', action: 'Get usage' },
					{ name: 'Get API Keys', value: 'getApiKeys', description: 'Get current API key', action: 'Get API keys' },
				],
				default: 'getInfo',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;
				const baseUrl = 'https://api.adsmedia.live/v1';

				// ============ EMAIL ============
				if (resource === 'email') {
					if (operation === 'sendSingle') {
						const body: Record<string, unknown> = {
							to: this.getNodeParameter('to', i) as string,
							subject: this.getNodeParameter('subject', i) as string,
							html: this.getNodeParameter('html', i) as string,
						};
						const additionalFields = this.getNodeParameter('additionalFields', i) as Record<string, unknown>;
						Object.assign(body, additionalFields);

						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'POST',
							url: `${baseUrl}/send`,
							body,
							json: true,
						});
					}
					else if (operation === 'sendBatch') {
						const body: Record<string, unknown> = {
							recipients: JSON.parse(this.getNodeParameter('recipients', i) as string),
							subject: this.getNodeParameter('batchSubject', i) as string,
							html: this.getNodeParameter('batchHtml', i) as string,
						};
						const batchOptions = this.getNodeParameter('batchOptions', i) as Record<string, unknown>;
						Object.assign(body, batchOptions);

						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'POST',
							url: `${baseUrl}/send/batch`,
							body,
							json: true,
						});
					}
					else if (operation === 'getStatus') {
						const lookup = this.getNodeParameter('statusLookup', i) as string;
						let url = `${baseUrl}/send/status`;
						if (lookup === 'messageId') {
							url += `?message_id=${this.getNodeParameter('messageId', i)}`;
						} else {
							url += `?id=${this.getNodeParameter('sendId', i)}`;
						}
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url,
							json: true,
						});
					}
					else if (operation === 'checkSuppression') {
						const email = this.getNodeParameter('suppressionEmail', i) as string;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/suppressions/check?email=${encodeURIComponent(email)}`,
							json: true,
						});
					}
				}

				// ============ CAMPAIGN ============
				else if (resource === 'campaign') {
					if (operation === 'getAll') {
						const limit = this.getNodeParameter('campaignLimit', i) as number;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/campaigns?limit=${limit}`,
							json: true,
						});
					}
					else if (operation === 'get') {
						const id = this.getNodeParameter('campaignId', i) as number;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/campaigns/get?id=${id}`,
							json: true,
						});
					}
					else if (operation === 'create') {
						const body: Record<string, unknown> = {
							name: this.getNodeParameter('campaignName', i) as string,
							subject: this.getNodeParameter('campaignSubject', i) as string,
							html: this.getNodeParameter('campaignHtml', i) as string,
						};
						const options = this.getNodeParameter('campaignOptions', i) as Record<string, unknown>;
						Object.assign(body, options);

						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'POST',
							url: `${baseUrl}/campaigns/create`,
							body,
							json: true,
						});
					}
					else if (operation === 'update') {
						const id = this.getNodeParameter('campaignId', i) as number;
						const options = this.getNodeParameter('campaignOptions', i) as Record<string, unknown>;

						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'POST',
							url: `${baseUrl}/campaigns/update?id=${id}`,
							body: options,
							json: true,
						});
					}
					else if (operation === 'delete') {
						const id = this.getNodeParameter('campaignId', i) as number;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'DELETE',
							url: `${baseUrl}/campaigns/delete?id=${id}`,
							json: true,
						});
					}
				}

				// ============ LIST ============
				else if (resource === 'list') {
					if (operation === 'getAll') {
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/lists`,
							json: true,
						});
					}
					else if (operation === 'create') {
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'POST',
							url: `${baseUrl}/lists/create`,
							body: {
								name: this.getNodeParameter('listName', i) as string,
								type: this.getNodeParameter('listType', i) as number,
							},
							json: true,
						});
					}
					else if (operation === 'split') {
						const id = this.getNodeParameter('splitListId', i) as number;
						const maxSize = this.getNodeParameter('splitMaxSize', i) as number;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'POST',
							url: `${baseUrl}/lists/split?id=${id}`,
							body: { max_size: maxSize },
							json: true,
						});
					}
				}

				// ============ CONTACT ============
				else if (resource === 'contact') {
					const listId = this.getNodeParameter('contactListId', i) as number;

					if (operation === 'getAll') {
						const limit = this.getNodeParameter('contactLimit', i) as number;
						const offset = this.getNodeParameter('contactOffset', i) as number;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/lists/contacts?id=${listId}&limit=${limit}&offset=${offset}`,
							json: true,
						});
					}
					else if (operation === 'add') {
						const contacts = JSON.parse(this.getNodeParameter('contactsToAdd', i) as string);
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'POST',
							url: `${baseUrl}/lists/contacts/add?id=${listId}`,
							body: { contacts },
							json: true,
						});
					}
					else if (operation === 'delete') {
						const emailsStr = this.getNodeParameter('contactsToDelete', i) as string;
						const emails = emailsStr.split(',').map(e => e.trim());
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'DELETE',
							url: `${baseUrl}/lists/contacts/delete?id=${listId}`,
							body: { emails },
							json: true,
						});
					}
				}

				// ============ SCHEDULE ============
				else if (resource === 'schedule') {
					if (operation === 'getAll') {
						const status = this.getNodeParameter('scheduleStatus', i) as string;
						let url = `${baseUrl}/schedules`;
						if (status) url += `?status=${status}`;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url,
							json: true,
						});
					}
					else if (operation === 'create') {
						const body: Record<string, unknown> = {
							campaign_id: this.getNodeParameter('scheduleCampaignId', i) as number,
							list_id: this.getNodeParameter('scheduleListId', i) as number,
							server_id: this.getNodeParameter('scheduleServerId', i) as number,
						};
						const options = this.getNodeParameter('scheduleOptions', i) as Record<string, unknown>;
						Object.assign(body, options);

						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'POST',
							url: `${baseUrl}/schedules/create`,
							body,
							json: true,
						});
					}
					else if (operation === 'update') {
						const id = this.getNodeParameter('scheduleId', i) as number;
						const fields = this.getNodeParameter('scheduleUpdateFields', i) as Record<string, unknown>;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'PUT',
							url: `${baseUrl}/schedules/update?id=${id}`,
							body: fields,
							json: true,
						});
					}
					else if (operation === 'pause') {
						const id = this.getNodeParameter('scheduleId', i) as number;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'POST',
							url: `${baseUrl}/schedules/pause?id=${id}`,
							json: true,
						});
					}
					else if (operation === 'resume') {
						const id = this.getNodeParameter('scheduleId', i) as number;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'POST',
							url: `${baseUrl}/schedules/resume?id=${id}`,
							json: true,
						});
					}
					else if (operation === 'stop') {
						const id = this.getNodeParameter('scheduleId', i) as number;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'DELETE',
							url: `${baseUrl}/schedules/stop?id=${id}`,
							json: true,
						});
					}
				}

				// ============ STATISTICS ============
				else if (resource === 'statistics') {
					if (operation === 'overview') {
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/stats/overview`,
							json: true,
						});
					}
					else {
						const taskId = this.getNodeParameter('statsTaskId', i) as number;
						let url = '';

						if (operation === 'campaign') url = `${baseUrl}/stats/campaign?id=${taskId}`;
						else if (operation === 'hourly') url = `${baseUrl}/stats/hourly?id=${taskId}`;
						else if (operation === 'daily') url = `${baseUrl}/stats/daily?id=${taskId}`;
						else if (operation === 'countries') url = `${baseUrl}/stats/countries?id=${taskId}`;
						else if (operation === 'bounces') url = `${baseUrl}/stats/bounces?id=${taskId}`;
						else if (operation === 'providers') url = `${baseUrl}/stats/providers?id=${taskId}`;
						else if (operation === 'events') {
							const type = this.getNodeParameter('eventType', i) as string;
							const limit = this.getNodeParameter('eventsLimit', i) as number;
							url = `${baseUrl}/stats/events?id=${taskId}&limit=${limit}`;
							if (type) url += `&type=${type}`;
						}

						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url,
							json: true,
						});
					}
				}

				// ============ SERVER ============
				else if (resource === 'server') {
					if (operation === 'getAll') {
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/servers`,
							json: true,
						});
					}
					else if (operation === 'get') {
						const id = this.getNodeParameter('serverId', i) as number;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/servers/get?id=${id}`,
							json: true,
						});
					}
					else if (operation === 'verifyDomain') {
						const id = this.getNodeParameter('serverId', i) as number;
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/domains/verify?server_id=${id}`,
							json: true,
						});
					}
				}

				// ============ ACCOUNT ============
				else if (resource === 'account') {
					if (operation === 'getInfo') {
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/account`,
							json: true,
						});
					}
					else if (operation === 'getUsage') {
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/account/usage`,
							json: true,
						});
					}
					else if (operation === 'getApiKeys') {
						responseData = await this.helpers.requestWithAuthentication.call(this, 'adsMediaApi', {
							method: 'GET',
							url: `${baseUrl}/account/api-keys`,
							json: true,
						});
					}
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as Record<string, unknown>),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}


