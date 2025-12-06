import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { adsMediaAuth } from '../../index';
import { makeRequest } from '../common';

export const addContacts = createAction({
  auth: adsMediaAuth,
  name: 'add_contacts',
  displayName: 'Add Contacts to List',
  description: 'Add contacts to a list in ADSMedia',
  props: {
    listId: Property.Number({
      displayName: 'List ID',
      required: true,
      description: 'ID of the list to add contacts to',
    }),
    contacts: Property.Array({
      displayName: 'Contacts',
      required: true,
      description: 'Array of contacts to add',
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
        firstName: Property.ShortText({
          displayName: 'First Name',
          required: false,
        }),
        lastName: Property.ShortText({
          displayName: 'Last Name',
          required: false,
        }),
        custom1: Property.ShortText({
          displayName: 'Custom Field 1',
          required: false,
        }),
        custom2: Property.ShortText({
          displayName: 'Custom Field 2',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth as string,
      HttpMethod.POST,
      `/lists/contacts/add?id=${context.propsValue.listId}`,
      {
        contacts: context.propsValue.contacts,
      }
    );

    return response.data;
  },
});

