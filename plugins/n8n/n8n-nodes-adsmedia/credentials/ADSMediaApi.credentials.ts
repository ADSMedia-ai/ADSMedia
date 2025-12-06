import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ADSMediaApi implements ICredentialType {
	name = 'adsMediaApi';
	displayName = 'ADSMedia API';
	documentationUrl = 'https://adsmedia.ai/api-docs';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your ADSMedia API key. Get it from your ADSMedia dashboard.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.adsmedia.live/v1',
			url: '/ping',
			method: 'GET',
		},
	};
}


