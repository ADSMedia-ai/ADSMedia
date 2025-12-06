import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.adsmedia.live/v1';

export interface ADSMediaResponse {
  success: boolean;
  data: any;
  timestamp: string;
  error?: { code: string; message: string };
}

export async function makeRequest(
  apiKey: string,
  method: HttpMethod,
  endpoint: string,
  body?: Record<string, unknown>,
  params?: Record<string, string>
): Promise<ADSMediaResponse> {
  const response = await httpClient.sendRequest<ADSMediaResponse>({
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body,
    queryParams: params,
  });

  if (!response.body.success) {
    throw new Error(response.body.error?.message || 'Unknown error');
  }

  return response.body;
}

export const common = {
  baseUrl: BASE_URL,
  makeRequest,
};

