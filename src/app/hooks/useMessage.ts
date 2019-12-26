import { useContext, useEffect, useCallback, useState, useMemo } from 'react';
import { useApi, useEventManager } from 'react-components';
import {
    getMessage,
    markMessageAsRead,
    createDraft as createDraftApi,
    updateDraft,
    deleteMessages
} from 'proton-shared/lib/api/messages';

import { transformEscape } from '../helpers/transforms/transformEscape';
import { transformLinks } from '../helpers/transforms/transformLinks';
import { transformEmbedded } from '../helpers/transforms/transformEmbedded';
import { transformWelcome } from '../helpers/transforms/transformWelcome';
import { transformBlockquotes } from '../helpers/transforms/transformBlockquotes';
import { transformStylesheet } from '../helpers/transforms/transformStylesheet';
import { transformRemote } from '../helpers/transforms/transformRemote';
import { transformBase } from '../helpers/transforms/transformBase';
import { useDecryptMessage } from './useDecryptMessage';
import { AttachmentsCache, useAttachmentsCache } from './useAttachments';
import { MessageContext } from '../containers/MessageProvider';
import { Message, MessageExtended } from '../models/message';
import { useSendMessage } from './useSendMessage';
import { MailSettings, Api } from '../models/utils';
import { useEncryptMessage } from './useEncryptMessage';

export interface ComputationOption {
    action?: string;
    cache: any;
    mailSettings: MailSettings;
    api: Api;
    attachmentsCache: AttachmentsCache;
}

export interface Computation {
    (message: MessageExtended, options: ComputationOption):
        | Promise<Partial<MessageExtended>>
        | Partial<MessageExtended>;
}

interface MessageActions {
    initialize: () => Promise<void>;
    loadRemoteImages: () => Promise<void>;
    loadEmbeddedImages: () => Promise<void>;
    createDraft: (message: MessageExtended) => Promise<void>;
    saveDraft: (message: MessageExtended) => Promise<void>;
    send: (message: MessageExtended) => Promise<void>;
    deleteDraft: () => Promise<void>;
}

/**
 * Apply updates from the message model to the message in state
 */
export const mergeMessages = (messageState: MessageExtended, messageModel: MessageExtended) => {
    if (messageState.document) {
        messageState.document.innerHTML = messageModel.content || '';
    }
    const message = {
        ...messageState,
        content: messageModel.content,
        data: { ...messageState.data, ...messageModel.data }
    };
    return message;
};

export const useMessage = (inputMessage: Message, mailSettings: any): [MessageExtended, MessageActions] => {
    const api = useApi();
    const { call } = useEventManager();
    const cache = useContext(MessageContext);
    const computeCache = useMemo(() => new Map(), []);
    const attachmentsCache = useAttachmentsCache();

    // messageID change ONLY when a draft is created
    const [messageID, setMessageID] = useState(inputMessage.ID || '');
    const [message, setMessage] = useState<MessageExtended>(
        cache.has(messageID) ? cache.get(messageID) : { data: inputMessage }
    );

    const decrypt = useDecryptMessage();
    const encrypt = useEncryptMessage();
    const sendMessage = useSendMessage();

    // Update messageID if component is reused for another message
    useEffect(() => {
        if (!!inputMessage.ID && inputMessage.ID !== messageID) {
            setMessageID(inputMessage.ID);
        }
    }, [inputMessage]);

    // Update message state and listen to cache for updates on the current message
    useEffect(() => {
        cache.has(messageID) ? setMessage(cache.get(messageID)) : setMessage({ data: inputMessage });

        return cache.subscribe((changedMessageID) => {
            // Prevent updates on message deltion from the cache to prevent undefined message in state.
            if (changedMessageID === messageID && cache.has(messageID)) {
                setMessage(cache.get(messageID));
            }
        });
    }, [messageID, cache]);

    const transforms = [
        transformEscape,
        transformBase,
        transformLinks,
        transformEmbedded,
        transformWelcome,
        transformBlockquotes,
        transformStylesheet,
        transformRemote
    ];

    const loadData = useCallback(
        async ({ data: message = {} }: MessageExtended) => {
            // If the Body is already there, no need to send a request
            if (!message.Body) {
                const { Message } = await api(getMessage(message.ID));
                return { data: Message as Message };
            }
            return {} as MessageExtended;
        },
        [api]
    );

    const markAsRead = useCallback(
        async ({ data: message = {} }: MessageExtended) => {
            const markAsRead = async () => {
                await api(markMessageAsRead([message.ID || '']));
                call();
            };

            if (message.Unread) {
                markAsRead(); // No await to not slow down the UX
                return { data: { ...message, Unread: 0 } } as MessageExtended;
            }

            return {} as MessageExtended;
        },
        [api]
    );

    const create = useCallback(
        async (message: MessageExtended = {}) => {
            const { Message } = await api(createDraftApi({ Message: message.data } as any));
            call();
            return { data: Message };
        },
        [api]
    );

    const update = useCallback(
        async (message: MessageExtended = {}) => {
            const { Message } = await api(updateDraft(message.data?.ID, message.data));
            call();
            return { data: Message };
        },
        [api]
    );

    const deleteRequest = useCallback(
        async (message: MessageExtended = {}) => {
            await api(deleteMessages([message.data?.ID]));
            call();
            return {};
        },
        [api]
    );

    /**
     * Run a computation on a message, wait until it finish
     * Return the message extanded with the result of the computation
     */
    const runSingle = useCallback(
        async (message: MessageExtended, compute: Computation, action?: string) => {
            const result =
                (await compute(message, { action, cache: computeCache, mailSettings, api, attachmentsCache })) || {};

            if (result.document) {
                result.content = result.document.innerHTML;
            }

            return { ...message, ...result } as MessageExtended;
        },
        [cache]
    );

    /**
     * Run a list of computation sequentially
     */
    const run = useCallback(
        async (message: MessageExtended, computes: Computation[], action?: string) => {
            return computes.reduce(async (messagePromise: Promise<MessageExtended>, compute: Computation) => {
                return runSingle(await messagePromise, compute, action);
            }, Promise.resolve(message));
        },
        [runSingle, cache]
    );

    const initialize = useCallback(
        async (action?) => {
            cache.set(messageID, { ...message, initialized: false });
            const newMessage = await run(
                message,
                [loadData, decrypt, markAsRead, ...transforms] as Computation[],
                action
            );
            cache.set(messageID, { ...newMessage, initialized: true });
        },
        [messageID, message, run, cache]
    );

    const loadRemoteImages = useCallback(
        async (action?) => {
            const newMessage = await run(
                { ...message, showRemoteImages: true },
                [transformRemote as Computation],
                action
            );
            cache.set(messageID, newMessage);
        },
        [messageID, message, message, run, cache]
    );

    const loadEmbeddedImages = useCallback(
        async (action?) => {
            const newMessage = await run({ ...message, showEmbeddedImages: true }, [transformEmbedded], action);
            cache.set(messageID, newMessage);
        },
        [messageID, message, run, cache]
    );

    const createDraft = useCallback(
        async (message: MessageExtended) => {
            const newMessage = await run(message, [encrypt, create]);
            cache.set(newMessage.data?.ID || '', newMessage);
            setMessageID(newMessage.data?.ID || '');
        },
        [message, run, cache]
    );

    const saveDraft = useCallback(
        async (messageModel: MessageExtended) => {
            const messageToSave = mergeMessages(message, messageModel);
            const newMessage = await run(messageToSave, [encrypt, update]);
            cache.set(messageID, newMessage);
        },
        [message, run, cache]
    );

    const send = useCallback(
        async (messageModel: MessageExtended) => {
            const messageToSave = mergeMessages(message, messageModel);
            const newMessage = await run(messageToSave, [encrypt, update, sendMessage]);
            cache.set(messageID, newMessage);
        },
        [message, run, cache]
    );

    const deleteDraft = useCallback(async () => {
        await run(message, [deleteRequest]);
        cache.delete(messageID);
    }, [message, run, cache]);

    return [
        message,
        {
            initialize,
            loadRemoteImages,
            loadEmbeddedImages,
            createDraft,
            saveDraft,
            send,
            deleteDraft
        }
    ];
};
