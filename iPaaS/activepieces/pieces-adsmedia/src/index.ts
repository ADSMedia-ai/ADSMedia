import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendEmail } from './lib/actions/send-email';
import { sendBatch } from './lib/actions/send-batch';
import { createCampaign } from './lib/actions/create-campaign';
import { addContacts } from './lib/actions/add-contacts';
import { getCampaignStats } from './lib/actions/get-campaign-stats';

export const adsMediaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your ADSMedia API key from https://www.adsmedia.ai',
});

export const adsmedia = createPiece({
  displayName: 'ADSMedia',
  auth: adsMediaAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://www.adsmedia.ai/logoBig.png',
  authors: ['ADSMedia'],
  description: 'Send transactional and marketing emails via ADSMedia API',
  actions: [
    sendEmail,
    sendBatch,
    createCampaign,
    addContacts,
    getCampaignStats,
  ],
  triggers: [],
});

