import { MIME_TYPES, PACKAGE_TYPE } from 'proton-shared/lib/constants';

import { MessageExtended } from '../../models/message';
import { MapPreference } from './sendPreferences';

import { constructMime } from './sendMimeBuilder';
import { addReceived, getPlainText, getHTML } from '../message/messages';
import { PmcryptoKey } from 'pmcrypto';
import { AttachmentsDataCache } from '../../hooks/useAttachments';
import { Api } from '../../models/utils';

// Reference: Angular/src/app/composer/services/encryptMessage.js
// Reference: Angular/src/app/composer/services/generateTopPackages.js

const { PLAINTEXT, DEFAULT, MIME } = MIME_TYPES;

type PackageStatus = {
    [key in MIME_TYPES]?: boolean;
};

export type Packages = {
    [key in MIME_TYPES]?: Package;
};

export interface Package {
    Flags?: number;
    Addresses?: { [email: string]: Package };
    MIMEType?: MIME_TYPES;
    Body?: string;
    BodyKey?: any;
    BodyKeyPacket?: string;
    Type?: PACKAGE_TYPE;
    PublicKey?: PmcryptoKey;
    AttachmentKeys?: { [AttachmentID: string]: { Key: string; Algorithm: string } };
    AttachmentKeyPackets?: { [AttachmentID: string]: string };
}

/**
 * Generates the mime top-level packages, which include all attachments in the body.
 * Build the multipart/alternate MIME entity containing both the HTML and plain text entities.
 */
const generateMimePackage = async (
    message: MessageExtended,
    cache: AttachmentsDataCache,
    api: Api
): Promise<Package> => ({
    Flags: addReceived(message.data?.Flags),
    Addresses: {},
    MIMEType: MIME,
    Body: await constructMime(message, cache, api)
});

const generatePlainTextPackage = async (message: MessageExtended): Promise<Package> => ({
    Flags: addReceived(message.data?.Flags),
    Addresses: {},
    MIMEType: PLAINTEXT,
    Body: getPlainText(message, true)
});

const generateHTMLPackage = async (message: MessageExtended): Promise<Package> => ({
    Flags: addReceived(message.data?.Flags),
    Addresses: {},
    MIMEType: DEFAULT,
    Body: getHTML(message)
});

/**
 * Generates all top level packages. The top level packages have unencrypted bodies which are encrypted later on
 * once the sub level packages are attached, so we know with which keys we need to encrypt the bodies with.
 * Top level packages that are not needed are not generated.
 */
export const generateTopPackages = async (
    message: MessageExtended,
    sendPrefs: MapPreference,
    cache: AttachmentsDataCache,
    api: Api
): Promise<Packages> => {
    const packagesStatus: PackageStatus = Object.values(sendPrefs).reduce(
        (packages, info) => ({
            [PLAINTEXT]: packages[PLAINTEXT] || info.mimetype === MIME_TYPES.PLAINTEXT,
            [DEFAULT]:
                packages[DEFAULT] ||
                info.mimetype === DEFAULT ||
                (info.scheme === PACKAGE_TYPE.SEND_PGP_MIME && !info.encrypt && !info.sign),
            [MIME]: packages[MIME] || (info.scheme === PACKAGE_TYPE.SEND_PGP_MIME && (info.encrypt || info.sign))
        }),
        {
            [PLAINTEXT]: false,
            [DEFAULT]: false,
            [MIME]: false
        } as PackageStatus
    );

    const demandedPackages = Object.values(MIME_TYPES).filter((k) => packagesStatus[k]);

    const packages: Packages = {};

    await Promise.all(
        demandedPackages.map(async (type) => {
            switch (type) {
                case MIME:
                    packages[MIME] = await generateMimePackage(message, cache, api);
                    return;
                case PLAINTEXT:
                    packages[PLAINTEXT] = await generatePlainTextPackage(message);
                    return;
                case DEFAULT:
                    packages[DEFAULT] = await generateHTMLPackage(message);
                    console.log('sendTopPackages', { ...packages[DEFAULT] });
                    return;
                default:
                    throw new Error(); // Should never happen.
            }
        })
    );

    return packages;
};
