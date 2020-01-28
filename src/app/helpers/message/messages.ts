import { MIME_TYPES } from 'proton-shared/lib/constants';
import { hasBit, setBit } from 'proton-shared/lib/helpers/bitset';
import { identity } from 'proton-shared/lib/helpers/function';

import { MESSAGE_FLAGS, SIGNATURE_START } from '../../constants';
import { Message, MessageExtended } from '../../models/message';
import { toText } from '../parserHtml';

const {
    FLAG_RECEIVED,
    FLAG_SENT,
    FLAG_RECEIPT_REQUEST,
    FLAG_IMPORTED,
    FLAG_REPLIED,
    FLAG_REPLIEDALL,
    FLAG_FORWARDED,
    FLAG_INTERNAL,
    FLAG_AUTO,
    FLAG_E2E,
    FLAG_SIGN,
    FLAG_PUBLIC_KEY
} = MESSAGE_FLAGS;

const { PLAINTEXT, MIME } = MIME_TYPES;

/**
 * Check if a message has a mime type
 */
const hasMimeType = (type: MIME_TYPES) => ({ MIMEType }: Message = {}) => MIMEType === type;

export const isMIME = hasMimeType(MIME);
export const isPlainText = hasMimeType(PLAINTEXT);
export const isHTML = hasMimeType(MIME_TYPES.DEFAULT);

/**
 * Check if a message has a flag in the flags bitmap
 */
export const hasFlag = (flag: number) => ({ Flags = 0 }: Message = {}) => hasBit(Flags, flag);

export const isRequestReadReceipt = hasFlag(FLAG_RECEIPT_REQUEST);
export const isImported = hasFlag(FLAG_IMPORTED);
export const isInternal = hasFlag(FLAG_INTERNAL);
export const isExternal = (message: Message) => !isInternal(message);
export const isAuto = hasFlag(FLAG_AUTO);
export const isReceived = hasFlag(FLAG_RECEIVED);
export const isSent = hasFlag(FLAG_SENT);
export const isReplied = hasFlag(FLAG_REPLIED);
export const isRepliedAll = hasFlag(FLAG_REPLIEDALL);
export const isForwarded = hasFlag(FLAG_FORWARDED);
export const isSentAndReceived = hasFlag(FLAG_SENT | FLAG_RECEIVED);
export const isDraft = (message: Message = {}) => !isSent(message) && !isReceived(message);
export const isE2E = hasFlag(FLAG_E2E);
export const isSentEncrypted = hasFlag(FLAG_E2E | FLAG_SENT);
export const isInternalEncrypted = hasFlag(FLAG_E2E | FLAG_INTERNAL);
export const isSign = hasFlag(FLAG_SIGN);
export const isAttachPublicKey = hasFlag(FLAG_PUBLIC_KEY);
export const isExternalEncrypted = (message: Message) => isE2E(message) && !isInternal(message);
export const isPGPEncrypted = (message: Message = {}) => isExternal(message) && isReceived(message) && isE2E(message);
export const inSigningPeriod = ({ Time = 0 }: Message) => Time >= SIGNATURE_START;

export const isPGPInline = (message: Message) => isPGPEncrypted(message) && !isMIME(message);

export const isEO = (message: Message = {}) => !!message.Password;

export const addReceived = (Flags = 0) => setBit(Flags, MESSAGE_FLAGS.FLAG_RECEIVED);

export const getSender = ({ Sender = {} }: Message = {}) => Sender;
export const getRecipients = ({ ToList = [], CCList = [], BCCList = [] }: Message = {}) => [
    ...ToList,
    ...CCList,
    ...BCCList
];
// export const getRecipientsLabels = (message: Message = {}) => getRecipients(message).map(getRecipientLabel);
export const getRecipientsAddresses = (message: Message = {}) =>
    getRecipients(message)
        .map(({ Address }) => Address || '')
        .filter(identity);

/**
 * Extract and normalize recipients
 * @param {Object} message
 * @return {Array<String>}
 */
// export const normalizeRecipients = (message = {}) => {
//     return getRecipients(message).map(({ Address }) => normalizeEmail(Address));
// };

/**
 * Decrypt simple message body with password
 * @param {String} message.Body
 * @param {String} password
 * @return {String} body
 */
// export async function decrypt({ Body = '' } = {}, password) {
//     const message = await getMessage(Body);
//     const { data: body } = await decryptMessage({
//         message,
//         passwords: [password]
//     });
//     return body;
// }

/**
 * Get the label ids to add for a message that has moved.
 *
 * Types definition
 *   - 1: a draft
 * if you move it to trash and back to inbox, it will go to draft instead
 *   - 2: is sent
 *  if you move it to trash and back, it will go back to sent
 *   - 3: is inbox and sent (a message sent to yourself)
 * if you move it from trash to inbox, it will acquire both the inbox and sent labels ( 0 and 2 ).
 *
 * @param {Message} message
 * @param {String} labelID label id to which it is moved
 * @returns {Array}
 */
// export const getLabelIDsMoved = (message, labelID) => {
//     const toInbox = labelID === MAILBOX_IDENTIFIERS.inbox;

//     if (toInbox) {
//         // This message is a draft, if you move it to trash and back to inbox, it will go to draft instead
//         if (message.isDraft()) {
//             return [MAILBOX_IDENTIFIERS.allDrafts, MAILBOX_IDENTIFIERS.drafts];
//         }

//         // If you move it from trash to inbox, it will acquire both the inbox and sent labels ( 0 and 2 ).
//         if (message.isSentAndReceived()) {
//             return [MAILBOX_IDENTIFIERS.inbox, MAILBOX_IDENTIFIERS.allSent, MAILBOX_IDENTIFIERS.sent];
//         }

//         // This message is sent, if you move it to trash and back, it will go back to sent
//         if (message.isSent()) {
//             return [MAILBOX_IDENTIFIERS.allSent, MAILBOX_IDENTIFIERS.sent];
//         }
//     }

//     return [labelID];
// };

/**
 * Get date from message
 */
export const getDate = ({ Time = 0 }: Message = {}) => new Date(Time * 1000);

/**
 * Check if these all messages shared the same sender (by email address)
 * @param {Array<message>} messages
 * @return {Boolean}
 */
// export const sameSender = (messages = []) => {
//     if (!messages.length) {
//         return false;
//     }

//     const [{ Sender: firstSender } = {}] = messages;
//     const firstAddress = normalizeEmail(firstSender.Address);

//     return (
//         messages.length ===
//         messages.filter(({ Sender = {} }) => {
//             return normalizeEmail(Sender.Address) === firstAddress;
//         }).length
//     );
// };

export const getParsedHeaders = (message: Message, parameter: string) => {
    const { ParsedHeaders = {} } = message;

    if (parameter) {
        return ParsedHeaders[parameter];
    }

    return ParsedHeaders;
};

export const getListUnsubscribe = (message: Message) => {
    return getParsedHeaders(message, 'List-Unsubscribe') || '';
};

export const getListUnsubscribePost = (message: Message) => {
    return getParsedHeaders(message, 'List-Unsubscribe-Post') || '';
};

export const getAttachments = (message: Message = {}) => message.Attachments || [];
export const hasAttachments = (message: Message = {}) => getAttachments(message).length > 0;
export const attachmentsSize = (message: Message = {}) =>
    getAttachments(message).reduce((acc, { Size = 0 } = {}) => acc + +Size, 0);

export const isSentAutoReply = ({ Flags, ParsedHeaders = {} }: Message) => {
    if (!isSent({ Flags })) {
        return false;
    }

    if (isAuto({ Flags })) {
        return true;
    }

    const autoReplyHeaders = ['X-Autoreply', 'X-Autorespond', 'X-Autoreply-From', 'X-Mail-Autoreply'];
    const autoReplyHeaderValues = [
        ['Auto-Submitted', 'auto-replied'],
        ['Precedence', 'auto_reply'],
        ['X-Precedence', 'auto_reply'],
        ['Delivered-To', 'autoresponder']
    ];
    // These headers are not always available. But we should check them to support
    // outlook / mail autoresponses.
    return (
        autoReplyHeaders.some((h) => h in ParsedHeaders) ||
        autoReplyHeaderValues.some(([k, v]) => k in ParsedHeaders && ParsedHeaders[k].toLowerCase() === v)
    );
};

/**
 * We NEVER upconvert, if the user wants html: plaintext is actually fine as well
 */
export const getHTML = (message: MessageExtended) => (isHTML(message.data) ? message.content : undefined);

export const exportPlainText = (message: MessageExtended) => {
    /*
     * The replace removes any characters that are produced by the copying process (like zero width characters)
     * See: http://www.berklix.org/help/majordomo/#quoted we want to avoid sending unnecessary quoted printable encodings
     */
    if (message.data?.MIMEType !== MIME_TYPES.DEFAULT) {
        return message.content?.replace(/\u200B/g, '');
    }
    return toText(message.content || '', true, true).replace(/\u200B/g, '');
};

/**
 * Generates/Gets the plaintext body from the message. If the message is not composed in plaintext, it will downconvert
 * the html body to plaintext if downconvert is set. If downconvert is disabled it will return false.
 */
export const getPlainText = (message: MessageExtended, downconvert: boolean) => {
    if (!isPlainText(message.data) && !downconvert) {
        return undefined;
    }
    return exportPlainText(message);
};
