import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { adsMediaAuth } from '../../index';
import { makeRequest } from '../common';

export const createCampaign = createAction({
  auth: adsMediaAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Create a new email campaign in ADSMedia',
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    html: Property.LongText({
      displayName: 'HTML Content',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Plain Text',
      required: false,
    }),
    preheader: Property.ShortText({
      displayName: 'Preheader',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      defaultValue: 1,
      options: {
        options: [
          { label: 'HTML + Text', value: 1 },
          { label: 'HTML Only', value: 2 },
          { label: 'Text Only', value: 3 },
        ],
      },
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      '/campaigns/create',
      {
        name: context.propsValue.name,
        subject: context.propsValue.subject,
        html: context.propsValue.html,
        text: context.propsValue.text,
        preheader: context.propsValue.preheader,
        type: context.propsValue.type,
      }
    );

    return response.data;
  },
});

