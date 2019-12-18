import { encryptMessage } from 'pmcrypto';
import { MessageExtended } from '../../models/message';

// Reference: Angular/src/app/message/factories/messageModel.js encryptBody

export const encryptBody = async (
    message: MessageExtended,
    privateKeys: any,
    publicKeys: any
): Promise<MessageExtended> => {
    const { data } = await encryptMessage({
        data: message.content,
        publicKeys,
        privateKeys,
        format: 'utf8',
        compression: true
    });

    return { ...message, data: { ...message.data, Body: data } };
};
