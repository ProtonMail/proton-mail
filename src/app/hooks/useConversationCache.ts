import { useCache, useEventManager } from 'react-components';
import createCache from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';

import { Event } from '../models/eventManager';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { omit } from 'proton-shared/lib/helpers/object';
import { ConversationResult } from './useConversation';
import { Cache } from '../models/utils';

const CACHE_KEY = 'ConversationsCache';

export type ConversationCache = Cache<string, ConversationResult>;

const conversationListener = (cache: ConversationCache) => ({ Conversations }: Event) => {
    if (!Array.isArray(Conversations)) {
        return;
    }

    for (const { ID, Action, Conversation } of Conversations) {
        // Ignore updates for non-fetched messages.
        if (!cache.has(ID)) {
            continue;
        }
        if (Action === EVENT_ACTIONS.DELETE) {
            cache.delete(ID);
        }
        if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
            console.warn('Event type UPDATE_DRAFT on Conversation not supported', Conversations);
        }
        if (Action === EVENT_ACTIONS.UPDATE_FLAGS) {
            const currentValue = cache.get(ID);

            cache.set(ID, {
                Conversation: {
                    ...currentValue.Conversation,
                    ...omit(Conversation, ['LabelIDsRemoved', 'LabelIDsAdded'])
                },
                Messages: currentValue.Messages
            });
        }
    }
};

export const useConversationCache = (): ConversationCache => {
    const globalCache = useCache();
    const { subscribe } = useEventManager();

    if (!globalCache.has(CACHE_KEY)) {
        const cache = createCache(createLRU({ max: 50 } as any));
        subscribe(conversationListener(cache));
        globalCache.set(CACHE_KEY, cache);
    }

    return globalCache.get(CACHE_KEY);
};
