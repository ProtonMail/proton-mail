import {
    encryptMessage,
    splitMessage,
    armorBytes,
    concatArrays,
    generateSessionKey,
    encryptSessionKey
} from 'pmcrypto';

import { MessageExtended, Message } from '../../models/message';
import { Packages, Package } from './sendTopPackages';
import { getAttachments } from '../message/messages';
import { getSessionKey } from '../attachment/attachmentLoader';
import { Key, AddressKeys } from '../../models/key';
import { SessionKey } from '../attachment/attachmentLoader';
import { arrayToBase64 } from '../base64';
import { PACKAGE_TYPE } from 'proton-shared/lib/constants';
import { AES256 } from '../../constants';
import { SEND_MIME } from './sendSubPackages';
import { identity } from 'proton-shared/lib/helpers/function';
import { splitKeys } from 'proton-shared/lib/keys/keys';

// Reference: Angular/src/app/composer/services/encryptPackages.js

const { SEND_CLEAR, SEND_EO } = PACKAGE_TYPE;

const packToBase64 = ({ data, algorithm: Algorithm = AES256 }: SessionKey) => {
    return { Key: arrayToBase64(data), Algorithm };
};

const encryptKeyPacket = async ({
    sessionKeys = [],
    publicKeys = [],
    passwords = []
}: {
    sessionKeys?: SessionKey[];
    publicKeys?: Key[];
    passwords?: string[];
}) =>
    Promise.all(
        sessionKeys.map(async (sessionKey) => {
            const { message } = await encryptSessionKey({
                data: sessionKey.data,
                algorithm: sessionKey.algorithm,
                publicKeys: publicKeys.length > 0 ? publicKeys : undefined,
                passwords
            });
            const data = message.packets.write();
            return arrayToBase64(data);
        })
    );

/**
 * Encrypt the attachment session keys and add them to the package
 */
const encryptAttachmentKeys = (pack: Package, message: MessageExtended, attachmentKeys: SessionKey[]) => {
    console.log('encryptAttachmentKeys not implemented yet', pack, message, attachmentKeys);

    // TODO

    return;

    //     // multipart/mixed bodies already include the attachments so we don't add them here
    //     if (pack.MIMEType !== 'multipart/mixed') {
    //         const promises = _.map(pack.Addresses, (address) => {
    //             if (!(address.Type & SEND_TYPES.SEND_EO || address.PublicKey)) {
    //                 return Promise.resolve();
    //             }
    //             address.AttachmentKeyPackets = [];
    //             return encryptKeyPacket({
    //                 sessionKeys: _.map(attachmentKeys, ({ sessionKey }) => sessionKey),
    //                 passwords: address.Type & SEND_TYPES.SEND_EO ? [message.Password] : undefined,
    //                 publicKeys: address.Type & SEND_TYPES.SEND_EO ? undefined : [address.PublicKey]
    //             })
    //                 .then((keys) =>
    //                     _.zipObject(
    //                         _.map(attachmentKeys, ({ AttachmentID, ID }) => AttachmentID || ID),
    //                         keys
    //                     )
    //                 )
    //                 .then((AttachmentKeyPackets) => {
    //                     address.AttachmentKeyPackets = AttachmentKeyPackets;
    //                 });
    //         });
    //         if (pack.Type & SEND_TYPES.SEND_CLEAR) {
    //             pack.AttachmentKeys = _.extend(
    //                 ..._.map(attachmentKeys, ({ sessionKey = {}, AttachmentID, ID } = {}) => ({
    //                     [AttachmentID || ID]: packToBase64(sessionKey)
    //                 }))
    //             );
    //         }
    //         return Promise.all(promises);
    //     }
    //     return Promise.resolve();
};

/**
 * Generate random session key in the format openpgp creates them
 */
const generateSessionKeyHelper = async (): Promise<SessionKey> => ({
    algorithm: AES256,
    data: await generateSessionKey(AES256)
});

/**
 * Encrypt the body in the given package. Should only be used if the package body differs from message body
 * (i.e. the draft body)
 */
const encryptBodyPackage = async (pack: Package, ownKeys: AddressKeys[], publicKeys: Key[]) => {
    const { privateKeys } = splitKeys(ownKeys) as any;
    const cleanPublicKeys = publicKeys.filter(identity);

    const { data, sessionKey } = await encryptMessage({
        data: pack.Body,
        publicKeys: cleanPublicKeys,
        sessionKey: cleanPublicKeys.length ? undefined : await generateSessionKeyHelper(),
        privateKeys,
        returnSessionKey: true,
        compression: true
    });

    const { asymmetric: keys, encrypted } = await splitMessage(data);
    return { keys, encrypted, sessionKey };
};

/**
 * Encrypts the draft body. This is done separately from the other bodies so we can make sure that the send body
 * (the encrypted body in the message object) is the same as the other emails so we can use 1 blob for them in the api
 * (i.e. deduplication)
 */
const encryptDraftBodyPackage = async (
    pack: Package,
    ownKeys: AddressKeys[],
    publicKeys: Key[],
    message: MessageExtended
) => {
    // TODO: Do the change is equivalent?
    // const ownPublicKeys = await getKeys(message.From.Keys[0].PublicKey);
    // const publicKeys = ownPublicKeys.concat(_.filter(publicKeysList));

    const { privateKeys, publicKeys: ownPublicKeys } = splitKeys(ownKeys) as any;
    const cleanPublicKeys = [...ownPublicKeys, ...publicKeys].filter(identity);

    const { data, sessionKey } = await encryptMessage({
        data: pack.Body,
        publicKeys: cleanPublicKeys,
        privateKeys,
        returnSessionKey: true,
        compression: true
    });

    const packets = await splitMessage(data);

    const { asymmetric, encrypted } = packets;

    // rebuild the data without the send keypackets
    packets.asymmetric = packets.asymmetric.slice(0, ownPublicKeys.length) as any;
    // combine message
    const value = concatArrays(Object.values(packets).flat());
    // _.flowRight(concatArrays, _.flatten, _.values)(packets);

    (message.data as Message).Body = await armorBytes(value);

    return { keys: asymmetric.slice(ownPublicKeys.length), encrypted, sessionKey };
};

/**
 * Encrypts the body of the package and then overwrites the body in the package and adds the encrypted session keys
 * to the subpackages. If we send clear message the unencrypted session key is added to the (top-level) package too.
 */
const encryptBody = async (pack: Package, ownKeys: AddressKeys[], message: MessageExtended): Promise<void> => {
    const addressKeys = Object.keys(pack.Addresses || {});
    const addresses = Object.values(pack.Addresses || {});
    const publicKeysList = addresses.map(({ PublicKey }) => PublicKey as Key);
    /*
     * Special case: reuse the encryption packet from the draft, this allows us to do deduplication on the back-end.
     * In fact, this will be the most common case.
     */
    const encryptPack = message.data?.MIMEType === pack.MIMEType ? encryptDraftBodyPackage : encryptBodyPackage;

    const { keys, encrypted, sessionKey } = await encryptPack(pack, ownKeys, publicKeysList, message);

    let counter = 0;
    publicKeysList.forEach((publicKey, index) => {
        if (!publicKey) {
            return;
        }

        const key = keys[counter++];
        (pack.Addresses || {})[addressKeys[index]].BodyKeyPacket = arrayToBase64(key);
    });

    await Promise.all(
        addresses.map(async (subPack) => {
            if (subPack.Type !== SEND_EO) {
                return;
            }
            const [BodyKeyPacket] = await encryptKeyPacket({
                sessionKeys: [sessionKey],
                passwords: [message.data?.Password || '']
            });

            // eslint-disable-next-line require-atomic-updates
            subPack.BodyKeyPacket = BodyKeyPacket;
        })
    );

    if ((pack.Type || 0) & (SEND_CLEAR | SEND_MIME)) {
        // eslint-disable-next-line require-atomic-updates
        pack.BodyKey = packToBase64(sessionKey);
    }
    // eslint-disable-next-line require-atomic-updates
    pack.Body = arrayToBase64(encrypted[0]);
};

const encryptPackage = async (
    pack: Package,
    message: MessageExtended,
    ownKeys: AddressKeys[],
    attachmentKeys: SessionKey[]
): Promise<Package> => {
    await Promise.all([encryptBody(pack, ownKeys, message), encryptAttachmentKeys(pack, message, attachmentKeys)]);

    Object.values(pack.Addresses || {}).forEach((address: any) => delete address.PublicKey);

    return pack;
};

const getAttachmentKeys = async (message: MessageExtended) =>
    Promise.all(getAttachments(message.data).map((attachment) => getSessionKey(message, attachment)));

/**
 * Encrypts the packages and removes all temporary values that should not be send to the API
 */
export const encryptPackages = async (
    message: MessageExtended,
    packages: Packages,
    getAddressKeys: (addressID?: string) => Promise<AddressKeys[]>
): Promise<Packages> => {
    const attachmentKeys = await getAttachmentKeys(message);
    const ownKeys = await getAddressKeys(message.data?.AddressID); // Original code: message.From.ID, don't know of From property

    const packageList = Object.values(packages) as Package[];
    await Promise.all(packageList.map((pack) => encryptPackage(pack, message, ownKeys, attachmentKeys)));

    return packages;
};
