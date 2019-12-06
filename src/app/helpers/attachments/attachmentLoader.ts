import {
    binaryStringToArray,
    concatArrays,
    decodeBase64,
    decryptMessage,
    decryptSessionKey,
    getMessage
} from 'pmcrypto';

import { getAttachment } from '../../api/attachments';
import { MessageExtended } from '../../models/message';
import { Attachment, AttachmentData } from '../../models/attachment';
import { AttachmentsCache } from '../../hooks/useAttachments';
import { Api } from '../../models/utils';

// Reference: Angular/src/app/attachments/services/AttachmentLoader.js

interface SessionKey {
    data?: Uint8Array;
    algorithm?: string;
}

// TODO: Handle isOutside()

export const decrypt = async (
    encryptedBinaryBuffer: ArrayBuffer,
    sessionKey: SessionKey = {}
): Promise<AttachmentData> => {
    const encryptedBinary = new Uint8Array(encryptedBinaryBuffer);

    try {
        return await decryptMessage({
            message: await getMessage(encryptedBinary),
            sessionKeys: [sessionKey],
            format: 'binary'
        });
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const getRequest = ({ ID }: Attachment = {}, api: Api): Promise<ArrayBuffer> => {
    // if (isOutside()) {
    //     const decryptedToken = eoStore.getToken();
    //     const token = $stateParams.tag;
    //     return Eo.attachment(decryptedToken, token, ID);
    // }

    return api(getAttachment(ID));
};

export const getSessionKey = async (attachment: Attachment, message: MessageExtended): Promise<SessionKey> => {
    // if (attachment.sessionKey) {
    //     return attachment;
    // }

    const keyPackets = binaryStringToArray(decodeBase64(attachment.KeyPackets));
    const options: any = { message: await getMessage(keyPackets) };

    // if (isOutside()) {
    //     options.passwords = [eoStore.getPassword()];
    // } else {
    // options.privateKeys = keysModel.getPrivateKeys(message.AddressID);
    options.privateKeys = message.privateKeys;
    // }

    const sessionKey = await decryptSessionKey(options);

    return sessionKey;
};

export const getDecryptedAttachment = async (
    attachment: Attachment,
    message: MessageExtended,
    api: Api
): Promise<AttachmentData> => {
    const encryptedBinary = await getRequest(attachment, api);
    try {
        const sessionKey = await getSessionKey(attachment, message);
        return await decrypt(encryptedBinary, sessionKey);
    } catch (error) {
        const blob = concatArrays([
            binaryStringToArray(decodeBase64(attachment.KeyPackets)),
            new Uint8Array(encryptedBinary)
        ]);
        // Fallback download raw attachment
        throw { data: attachment, binary: blob, error };
    }
};

export const getAndVerify = async (
    attachment: Attachment = {},
    message: MessageExtended = {},
    reverify = false,
    cache: AttachmentsCache,
    api: Api
): Promise<AttachmentData> => {
    let attachmentdata: AttachmentData;

    const attachmentID = attachment.ID || '';

    if (attachment.Preview) {
        return { data: attachment.Preview };
    }

    if (cache.has(attachmentID)) {
        attachmentdata = cache.get(attachmentID) as AttachmentData;
    } else {
        attachmentdata = await getDecryptedAttachment(attachment, message, api);

        if (reverify) {
            // await verify(attachment, newAttachment, message, signatures, signatureCache));
        }
    }

    cache.set(attachmentID, attachmentdata);

    return attachmentdata;
};

export const get = (
    attachment: Attachment = {},
    message: MessageExtended = {},
    cache: AttachmentsCache,
    api: Api
): Promise<AttachmentData> => getAndVerify(attachment, message, false, cache, api);

export const reverify = (
    attachment: Attachment = {},
    message: MessageExtended = {},
    cache: AttachmentsCache,
    api: Api
): Promise<AttachmentData> => getAndVerify(attachment, message, true, cache, api);
