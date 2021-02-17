import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { useCallback } from 'react';
import { useApi, useEventManager, useMailSettings } from 'react-components';
import { deleteMessages } from 'proton-shared/lib/api/messages';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { MAILBOX_LABEL_IDS, SHOW_MOVED } from 'proton-shared/lib/constants';

import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import { useGetMessageKeys } from './useGetMessageKeys';
import { mergeMessages } from '../../helpers/message/messages';
import { useMessageCache, updateMessageCache } from '../../containers/MessageProvider';
import { createMessage, updateMessage } from '../../helpers/message/messageExport';
import { createEquivalentEmbeddeds } from '../../helpers/embedded/embeddeds';

const { ALL_DRAFTS, DRAFTS } = MAILBOX_LABEL_IDS;

/**
 * Only takes technical stuff from the updated message
 */
export const mergeSavedMessage = (messageSaved: Message, messageReturned: Message): Message => ({
    ...messageSaved,
    ID: messageReturned.ID,
    Time: messageReturned.Time,
    ConversationID: messageReturned.ConversationID,
    LabelIDs: messageReturned.LabelIDs,
});

export const useCreateDraft = () => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();
    const getMessageKeys = useGetMessageKeys();

    return useCallback(async (message: MessageExtendedWithData) => {
        const messageKeys = await getMessageKeys(message.data);
        const newMessage = await createMessage(message, api, getMessageKeys);
        updateMessageCache(messageCache, message.localID, {
            data: { ...mergeSavedMessage(message.data, newMessage), Attachments: newMessage.Attachments },
            ...messageKeys,
            embeddeds: createEquivalentEmbeddeds(message.embeddeds, newMessage.Attachments),
            document: message.document,
            plainText: message.plainText,
        });
        await call();
    }, []);
};

const useUpdateDraft = () => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();
    const getMessageKeys = useGetMessageKeys();

    return useCallback(async (message: MessageExtendedWithData) => {
        const messageFromCache = messageCache.get(message.localID) as MessageExtended;
        const previousAddressID = messageFromCache.data?.AddressID || '';
        const newMessageKeys = await getMessageKeys(message.data);
        const messageToSave = mergeMessages(messageFromCache, message) as MessageExtendedWithData;
        const newMessage = await updateMessage(messageToSave, previousAddressID, api, getMessageKeys);
        updateMessageCache(messageCache, message.localID, {
            ...newMessageKeys,
            data: {
                ...mergeSavedMessage(message.data, newMessage),
                // If sender has changed, attachments are re-encrypted and then have to be updated
                Attachments: newMessage.Attachments,
            },
            document: message.document,
            plainText: message.plainText,
        });
        await call();
    }, []);
};

export const useSaveDraft = () => {
    const messageCache = useMessageCache();
    const updateDraft = useUpdateDraft();
    const createDraft = useCreateDraft();

    return useCallback(async (message: MessageExtendedWithData) => {
        const messageFromCache = messageCache.get(message.localID) as MessageExtended;

        if (messageFromCache?.data?.ID) {
            await updateDraft(message);
        } else {
            await createDraft(message);
        }
    }, []);
};

export const useDeleteDraft = () => {
    const api = useApi();
    const [mailSettings] = useMailSettings();
    const messageCache = useMessageCache();
    const { call } = useEventManager();

    return useCallback(
        async (message: MessageExtended) => {
            await api(
                deleteMessages(
                    [message.data?.ID],
                    Number(hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.DRAFTS) ? ALL_DRAFTS : DRAFTS)
                )
            );
            messageCache.delete(message.localID || '');
            await call();
        },
        [api, messageCache, mailSettings]
    );
};
