import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { Api } from 'proton-shared/lib/interfaces';
import { getEvents, getLatestID } from 'proton-shared/lib/api/events';
import { getMessage, queryMessageMetadata } from 'proton-shared/lib/api/messages';
import { wait } from 'proton-shared/lib/helpers/promise';
import { GetUserKeys, ESMetricsReport } from '../../models/encryptedSearch';
import { Event } from '../../models/event';
import { ES_LIMIT } from '../../constants';
import { getNumMessagesDB, getSizeIDB } from './esUtils';
import { getIndexKey } from './esBuild';

/**
 * Api calls for ES should be transparent and with low priority to avoid jailing
 */
const apiHelper = async <T>(api: Api, signal: AbortSignal | undefined, options: Object) => {
    return api<T>({
        ...options,
        silence: true,
        headers: { Priority: 'u=7' },
        signal,
    }).catch(() => undefined);
};

/**
 * Get the latest event or all events since a specified one
 */
export const queryEvents = async (api: Api, lastEvent?: string, signal?: AbortSignal) => {
    if (lastEvent) {
        return apiHelper<Event>(api, signal, getEvents(lastEvent));
    }
    return apiHelper<Event>(api, signal, getLatestID());
};

/**
 * Fetch metadata for a batch of messages
 */
export const queryMessagesMetadata = async (
    api: Api,
    options: {
        EndID?: string;
        Limit?: number;
        End?: number;
        PageSize?: number;
        Page?: number;
    },
    signal?: AbortSignal
) => {
    return apiHelper<{ Total: number; Messages: Message[] }>(
        api,
        signal,
        queryMessageMetadata({
            Limit: ES_LIMIT,
            Location: '5',
            Sort: 'Time',
            Desc: 1,
            ...options,
        } as any)
    );
};

/**
 * Fetch number of messages
 */
export const queryMessagesCount = async (api: Api, signal?: AbortSignal) => {
    const resultMetadata = await queryMessagesMetadata(api, { Limit: 1, PageSize: 1 }, signal);
    if (!resultMetadata) {
        return;
    }
    return { Total: resultMetadata.Total, firstMessage: resultMetadata.Messages[0] };
};

/**
 * Fetch one message
 */
export const queryMessage = async (api: Api, messageID: string, signal?: AbortSignal) => {
    const result = await apiHelper<{ Message: Message }>(api, signal, getMessage(messageID));
    return result?.Message;
};

/**
 * Send metrics about encrypted search usage
 */
export const sendESMetrics = async (
    getUserKeys: GetUserKeys,
    api: Api,
    userID: string,
    sizeCache: number,
    numMessagesSearched: number,
    searchTime: number,
    numMessagesFound: number,
    isFirstSearch: boolean,
    isCacheLimited: boolean
) => {
    const Log = 'encrypted_search';
    // Random number of seconds between 1 second and 3 minutes, expressed in milliseconds
    const randomDelay = 1000 * Math.floor(180 * Math.random() + 1);
    const storeManager = navigator.storage;

    const indexKey = await getIndexKey(getUserKeys, userID);
    if (!indexKey) {
        return;
    }

    const [numMessagesIDB, sizeIDBOnDisk] = await Promise.all([
        getNumMessagesDB(userID),
        storeManager
            ?.estimate()
            .then((storageDetails) => storageDetails.usage)
            .catch(() => undefined),
        wait(randomDelay),
    ]);

    const Data: ESMetricsReport = {
        numMessagesIDB,
        sizeIDB: getSizeIDB(userID),
        sizeIDBOnDisk,
        sizeCache,
        numMessagesSearched,
        searchTime,
        numMessagesFound,
        isFirstSearch,
        isCacheLimited,
    };

    return apiHelper<{ Code: number }>(api, undefined, {
        method: 'post',
        url: 'metrics',
        data: { Log, Data },
    });
};
