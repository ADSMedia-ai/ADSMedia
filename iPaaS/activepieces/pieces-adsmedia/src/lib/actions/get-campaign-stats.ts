import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { adsMediaAuth } from '../../index';
import { makeRequest } from '../common';

export const getCampaignStats = createAction({
  auth: adsMediaAuth,
  name: 'get_campaign_stats',
  displayName: 'Get Campaign Statistics',
  description: 'Get statistics for a campaign/task in ADSMedia',
  props: {
    taskId: Property.Number({
      displayName: 'Task ID',
      required: true,
      description: 'ID of the task/schedule to get statistics for',
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth as string,
      HttpMethod.GET,
      '/stats/campaign',
      undefined,
      { id: String(context.propsValue.taskId) }
    );

    return response.data;
  },
});

