import { c } from 'ttag';

import { MessageExtended } from '../../models/message';
import { MIME_TYPES } from 'react-components/node_modules/proton-shared/lib/constants';
import { Address } from '../../models/address';

// {"Message":{"ToList":[],"CCList":[],"BCCList":[],"Subject":"","Unread":0,"MIMEType":"text/html","Flags":0,
// "Sender":{"Name":"swiip.test","Address":"swiip.test@protonmail.blue"},
// "AddressID":"E6TQLiNkUC8MFseGJ60p0YHrqiGM0ETOUu0rKFGUikIPdcQAvL3b4ajyU4sls1XNYZ1ZXsdPrSL1EcaC5nmagw==",
// "Body":"-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v4.6.2\r\nComment: https://openpgpjs.org\r\n\r\nwcBMA4OXHjbvj9q+AQf6ArTLDp7G2ATBb3i0QZxelKDsOOgHAcfMImDPyweE\r\nhaEMKAZ2U91nIKHL5f7+TfB/vxtQcr8ZDzYLoZvNBH81vmIGCJo2uwuGfPKB\r\nyxj7O/QDW7+BgjY1Ijib2KwIyFFSfNcaV0buPyEV8VpMyDnYIAjnVG2DPkBU\r\n+qvUK6YlyX60ry0F9uI+ReKOIsqOYn4ke80MhmUcEj//6oK1BFGETHUmMdBW\r\nuknEz8JcsB/X2VwYMiMrhIkKo7LaUG2fArCn6P7KIRN8nj2DmNoDAGrsEOMR\r\nRAyCio4e3xmZheBvtNNUSzm00irBjMaUijisQV+VVbOuqgKCrkXy51Sh5nrS\r\nGdLBWAF/9gcZXk7HnwfWtBrP2bL03Fz1fXYeWtfLL3ir/IrZwYVBJI8ls+gw\r\nnXPlMxH2WlIzjNKJfoIH+YTkJskFFpJfExRn6tnX+PLLY5fgJ02+nXPYRbpV\r\nJwfv7zUzoEbXpcSqshP9MbUAgvq9Vii6E91b9hXVjO7rtUdPSBWBmcNoxFmw\r\nemCa3zukBBO/NTkfD3cTFaQ5uHc1WFXPfRgm5Ju32MxrY2LOpXblfVm8zbKu\r\nOY329PSzfxecyVxP2Xajbzb7aNDNIZtFXSwSqJQB0v1dEepPL/6cxV+ceaEH\r\nR7soER9dzi5a0RAo0hI4D14MIksPb5VbU0WWWGj6mB2C9WP2yP//ON/72eFq\r\nBdCsGTqq6QLopvXb6Hw5urasUa/2I38m4Fwgs+8G7qWRO+vmFFLmaMMyaPsE\r\nS7Ixzfj0DCPbtlhjjYEf5vh5Y/v16/GIE+3JELwt1j+/24gegUiZ7IPLnd9L\r\n2RIIA+Z0bU3GxOKvziupYiEAbGUGgKTqdh9sDkk6uuspclNL73ol++H5xHzk\r\nqB+GMYuQqCTzsfilVzD1TdoTQpYDekjj5M2SfxtfkPEJ2kx3iKcFC00sZH+R\r\nKRiYFmNTIDYRr0TZETHUbniUMWAhnBSx4d+KtPR/5HTQ67cb8gnpBaUG1wHv\r\nTdSPXwo+C0R7EhwlR5ADzQFAiEq7EMpC/b+4p3CHYRKr6NLZdwkkHOcbV3gR\r\n=iT0a\r\n-----END PGP MESSAGE-----\r\n"},
// "id":"","AttachmentKeyPackets":{}}

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
