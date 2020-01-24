import { useEffect } from 'react';
import { getConversation } from 'proton-shared/lib/api/conversations';
import { useApi, useLoading } from 'react-components';

import { Conversation } from '../models/conversation';
import { Message } from '../models/message';
import { useConversationCache } from './useConversationCache';

export interface ConversationResult {
    Conversation: Conversation;
    Messages?: Message[];
}

export const useConversation = (conversationID: string): [ConversationResult | undefined, boolean] => {
    const cache = useConversationCache();
    const api = useApi();
    const [loading, withLoading] = useLoading(true);

    useEffect(() => {
        const load = async () => {
            const result = await api(getConversation(conversationID));
            cache.set(conversationID, result);
        };
        if (!cache.has(conversationID)) {
            withLoading(load());
        }
    }, [conversationID, api, cache]);

    return [cache.get(conversationID), !cache.has(conversationID) || loading];
};
