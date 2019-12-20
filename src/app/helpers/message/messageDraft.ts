import { c } from 'ttag';

import { MIME_TYPES } from 'proton-shared/lib/constants';

import { MessageExtended } from '../../models/message';
import { Address } from '../../models/address';

// TODO: Find reference in Angular project
export const createNewDraft = (addresses: Address[]): MessageExtended => {
    // TODO: Check if it's the right logic
    const address = addresses.sort((a1, a2) => (a1.Priority || 0) - (a2.Priority || 0))[0];

    // TODO: Deal with signatures

    return {
        data: {
            ToList: [],
            CCList: [],
            BCCList: [],
            Subject: c('Title').t`New message`,
            Unread: 0,
            MIMEType: MIME_TYPES.DEFAULT,
            Flags: 0,
            Sender: {
                Name: address.DisplayName,
                Address: address.Email
            },
            AddressID: address.ID
        },
        content: 'coucou!'
    };
};
