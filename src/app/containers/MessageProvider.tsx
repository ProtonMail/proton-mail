import React, { useLayoutEffect, createContext } from 'react';
import { useInstance, useEventManager } from 'react-components';
import createCache from 'proton-shared/lib/helpers/cache';
import createLRU from 'proton-shared/lib/helpers/lru';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { MessageExtended } from '../models/message';
import { Event } from '../models/event';

interface Props {
    children: JSX.Element;
}

export interface Cache<Key, Value> {
    has: (key: Key) => boolean;
    get: (key: Key) => Value;
    set: (key: Key, value: Value) => void;
    delete: (key: Key) => void;
    subscribe: (handler: (key: Key) => void) => () => void;
}

export type MessageCache = Cache<string, MessageExtended>;

export const MessageContext = createContext<MessageCache>(null as any /* Just to please TS */);

/**
 * The purpose of this provider is to synchronize individual message fetches with updates from the event manager,
 * and to have a separate LRU cache for it.
 */
const MessageProvider = ({ children }: Props) => {
    const { subscribe } = useEventManager();
    const cache: MessageCache = useInstance(() => {
        return createCache(createLRU({ max: 50 } as any));
    });

    useLayoutEffect(() => {
        return subscribe(({ Messages }: Event) => {
            if (!Array.isArray(Messages)) {
                return;
            }
            for (const { ID, Action, Message } of Messages) {
                // Ignore updates for non-fetched messages.
                if (!cache.has(ID)) {
                    continue;
                }
                if (Action === EVENT_ACTIONS.DELETE) {
                    cache.delete(ID);
                }
                if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                    cache.set(ID, { ...cache.get(ID), ...Message });
                }
            }
        });
    }, []);

    return <MessageContext.Provider value={cache}>{children}</MessageContext.Provider>;
};

export default MessageProvider;
