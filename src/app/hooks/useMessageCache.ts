import { useCache, useEventManager } from 'react-components';
import createCache from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';

import { Event } from '../models/eventManager';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { omit } from 'proton-shared/lib/helpers/object';
import { Cache } from '../models/utils';
import { MessageExtended } from '../models/message';
import { diff } from 'proton-shared/lib/helpers/array';

const CACHE_KEY = 'MessagesCache';

export type MessageCache = Cache<string, MessageExtended>;

const messageListener = (cache: MessageCache) => ({ Messages }: Event) => {
    if (!Array.isArray(Messages)) {
        return;
    }

    console.log('Messages event', Messages);

    for (const { ID, Action, Message } of Messages) {
        // Ignore updates for non-fetched messages.
        if (!cache.has(ID)) {
            continue;
        }
        if (Action === EVENT_ACTIONS.DELETE) {
            cache.delete(ID);
        }
        if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
            console.warn('Event type UPDATE_DRAFT on Message not supported', Messages);
        }
        if (Action === EVENT_ACTIONS.UPDATE_FLAGS) {
            const currentValue = cache.get(ID);
            const messageEventData = Message;

            const LabelIDs = diff(currentValue.data?.LabelIDs || [], messageEventData.LabelIDsRemoved || []).concat(
                messageEventData.LabelIDsAdded
            );
            const MessageToUpdate = omit(Message, ['LabelIDsRemoved', 'LabelIDsAdded']);

            cache.set(ID, {
                ...currentValue,
                data: {
                    ...currentValue.data,
                    LabelIDs,
                    ...MessageToUpdate
                }
            });
        }
    }
};

export const useMessageCache = (): MessageCache => {
    const globalCache = useCache();
    const { subscribe } = useEventManager();

    if (!globalCache.has(CACHE_KEY)) {
        const cache = createCache(createLRU({ max: 50 } as any));
        subscribe(messageListener(cache));
        globalCache.set(CACHE_KEY, cache);
    }

    return globalCache.get(CACHE_KEY);
};
