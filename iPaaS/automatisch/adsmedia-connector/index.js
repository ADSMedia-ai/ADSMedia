const axios = require('axios');

const API_BASE_URL = 'https://api.adsmedia.live/v1';

module.exports = {
  name: 'ADSMedia',
  key: 'adsmedia',
  iconUrl: 'https://www.adsmedia.ai/favicon.ico',
  authUrl: '',
  baseUrl: API_BASE_URL,
  apiBaseUrl: API_BASE_URL,
  primaryColor: '4F46E5',
  
  auth: {
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'string',
        required: true,
        placeholder: 'Enter your ADSMedia API key',
        docUrl: 'https://www.adsmedia.ai/api-docs',
      },
    ],
    verifyCredentials: async (auth) => {
      const response = await axios.get(`${API_BASE_URL}/ping`, {
        headers: { Authorization: `Bearer ${auth.apiKey}` },
      });
      return response.data.success;
    },
  },

  actions: {
    sendEmail: {
      name: 'Send Email',
      key: 'sendEmail',
      description: 'Send a single transactional email',
      arguments: [
        { label: 'To', key: 'to', type: 'string', required: true },
        { label: 'Subject', key: 'subject', type: 'string', required: true },
        { label: 'HTML Content', key: 'html', type: 'string', required: true },
        { label: 'To Name', key: 'toName', type: 'string', required: false },
        { label: 'From Name', key: 'fromName', type: 'string', required: false },
      ],
      run: async (auth, args) => {
        const payload = {
          to: args.to,
          subject: args.subject,
          html: args.html,
        };
        if (args.toName) payload.to_name = args.toName;
        if (args.fromName) payload.from_name = args.fromName;

        const response = await axios.post(`${API_BASE_URL}/send`, payload, {
          headers: {
            Authorization: `Bearer ${auth.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        return response.data;
      },
    },

    sendBatch: {
      name: 'Send Batch Emails',
      key: 'sendBatch',
      description: 'Send marketing emails to multiple recipients',
      arguments: [
        { label: 'Recipients (JSON)', key: 'recipients', type: 'string', required: true },
        { label: 'Subject', key: 'subject', type: 'string', required: true },
        { label: 'HTML Content', key: 'html', type: 'string', required: true },
        { label: 'Preheader', key: 'preheader', type: 'string', required: false },
        { label: 'From Name', key: 'fromName', type: 'string', required: false },
      ],
      run: async (auth, args) => {
        const payload = {
          recipients: JSON.parse(args.recipients),
          subject: args.subject,
          html: args.html,
        };
        if (args.preheader) payload.preheader = args.preheader;
        if (args.fromName) payload.from_name = args.fromName;

        const response = await axios.post(`${API_BASE_URL}/send/batch`, payload, {
          headers: {
            Authorization: `Bearer ${auth.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        return response.data;
      },
    },

    checkSuppression: {
      name: 'Check Suppression',
      key: 'checkSuppression',
      description: 'Check if an email is suppressed',
      arguments: [
        { label: 'Email', key: 'email', type: 'string', required: true },
      ],
      run: async (auth, args) => {
        const response = await axios.get(`${API_BASE_URL}/suppressions/check`, {
          headers: { Authorization: `Bearer ${auth.apiKey}` },
          params: { email: args.email },
        });

        return response.data;
      },
    },

    addContacts: {
      name: 'Add Contacts to List',
      key: 'addContacts',
      description: 'Add contacts to a mailing list',
      arguments: [
        { label: 'List ID', key: 'listId', type: 'string', required: true },
        { label: 'Contacts (JSON)', key: 'contacts', type: 'string', required: true },
      ],
      run: async (auth, args) => {
        const response = await axios.post(
          `${API_BASE_URL}/lists/contacts/add?id=${args.listId}`,
          { contacts: JSON.parse(args.contacts) },
          {
            headers: {
              Authorization: `Bearer ${auth.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return response.data;
      },
    },
  },
};

