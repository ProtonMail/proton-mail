import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { useEffect, useState } from 'react';
import { getConversation } from 'proton-shared/lib/api/conversations';
import { useApi, useLoading } from 'react-components';

import { Conversation } from '../../models/conversation';
import { useConversationCache } from '../../containers/ConversationProvider';
import { useGetElementsFromIDs } from '../mailbox/useElementsCache';

export interface ConversationResult {
    Conversation: Conversation;
    Messages?: Message[];
}

interface ReturnValue {
    conversationID: string;
    conversation: ConversationResult | undefined;
    pendingRequest: boolean;
    loadingConversation: boolean;
    loadingMessages: boolean;
    numMessages: number | undefined;
}

interface UseConversation {
    (conversationID: string, messageID?: string): ReturnValue;
}

export const useConversation: UseConversation = (inputConversationID, messageID) => {
    const cache = useConversationCache();
    const getElementsFromIDs = useGetElementsFromIDs();
    const api = useApi();

    const [conversationID, setConversationID] = useState(inputConversationID);
    const [pendingRequest, withPendingRequest] = useLoading(!cache.has(conversationID));

    const initConversation = (): ConversationResult | undefined => {
        if (cache.has(inputConversationID)) {
            return cache.get(inputConversationID) as ConversationResult;
        }

        const [conversationFromElementsCache] = getElementsFromIDs([inputConversationID]) as Conversation[];

        if (conversationFromElementsCache) {
            return { Conversation: conversationFromElementsCache, Messages: undefined };
        }
    };

    const [conversation, setConversation] = useState<ConversationResult | undefined>(initConversation);

    useEffect(() => {
        const load = async () => {
            const result = (await api(getConversation(inputConversationID, messageID))) as ConversationResult;
            cache.set(inputConversationID, result);
        };

        const conversation = initConversation();
        setConversationID(inputConversationID);
        setConversation(conversation);

        if (conversation) {
            cache.set(inputConversationID, conversation);
        }

        if (!conversation || !conversation.Messages || !conversation.Messages.length) {
            void withPendingRequest(load());
        }

        return cache.subscribe((changedId: string) => {
            if (inputConversationID === changedId) {
                setConversation(cache.get(inputConversationID));
            }
        });
    }, [inputConversationID, messageID, api, cache]);

    const loadingConversation = !conversation?.Conversation;
    const loadingMessages = !conversation?.Messages?.length;
    const numMessages = conversation?.Messages?.length || conversation?.Conversation?.NumMessages;

    return { conversationID, conversation, pendingRequest, loadingConversation, loadingMessages, numMessages };
};
