import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { adsMediaAuth } from '../../index';
import { makeRequest } from '../common';

export const sendBatch = createAction({
  auth: adsMediaAuth,
  name: 'send_batch',
  displayName: 'Send Batch Emails',
  description: 'Send up to 1000 marketing emails in a batch with tracking',
  props: {
    recipients: Property.Array({
      displayName: 'Recipients',
      required: true,
      description: 'Array of recipient objects with email and optional name',
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Name',
          required: false,
        }),
      },
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
      description: 'Email subject. Supports: %%First Name%%, %%Last Name%%, %%emailaddress%%',
    }),
    html: Property.LongText({
      displayName: 'HTML Content',
      required: true,
      description: 'HTML content with personalization placeholders',
    }),
    text: Property.LongText({
      displayName: 'Plain Text',
      required: false,
    }),
    preheader: Property.ShortText({
      displayName: 'Preheader',
      required: false,
      description: 'Email preview text',
    }),
    fromName: Property.ShortText({
      displayName: 'From Name',
      required: false,
    }),
    serverId: Property.Number({
      displayName: 'Server ID',
      required: false,
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/send/batch',
      {
        recipients: context.propsValue.recipients,
        subject: context.propsValue.subject,
        html: context.propsValue.html,
        text: context.propsValue.text,
        preheader: context.propsValue.preheader,
        from_name: context.propsValue.fromName,
        server_id: context.propsValue.serverId,
      }
    );

    return response.data;
  },
});

