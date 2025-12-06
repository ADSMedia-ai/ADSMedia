import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { adsMediaAuth } from '../../index';
import { makeRequest } from '../common';

export const sendEmail = createAction({
  auth: adsMediaAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a single transactional email via ADSMedia API',
  props: {
    to: Property.ShortText({
      displayName: 'To Email',
      required: true,
      description: 'Recipient email address',
    }),
    toName: Property.ShortText({
      displayName: 'To Name',
      required: false,
      description: 'Recipient name',
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
      description: 'Email subject line',
    }),
    html: Property.LongText({
      displayName: 'HTML Content',
      required: true,
      description: 'HTML content of the email',
    }),
    text: Property.LongText({
      displayName: 'Plain Text',
      required: false,
      description: 'Plain text version (auto-generated if not provided)',
    }),
    fromName: Property.ShortText({
      displayName: 'From Name',
      required: false,
      description: 'Sender display name',
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply-To',
      required: false,
      description: 'Reply-to email address',
    }),
    serverId: Property.Number({
      displayName: 'Server ID',
      required: false,
      description: 'Specific server ID (random if not specified)',
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/send',
      {
        to: context.propsValue.to,
        to_name: context.propsValue.toName,
        subject: context.propsValue.subject,
        html: context.propsValue.html,
        text: context.propsValue.text,
        from_name: context.propsValue.fromName,
        reply_to: context.propsValue.replyTo,
        server_id: context.propsValue.serverId,
      }
    );

    return response.data;
  },
});

