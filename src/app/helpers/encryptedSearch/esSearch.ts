import { Recipient } from 'proton-shared/lib/interfaces';
import { IDBPDatabase, openDB } from 'idb';
import { endOfDay, endOfToday, startOfMonth, sub } from 'date-fns';
import { SearchParameters } from '../../models/tools';
import { Element } from '../../models/element';
import {
    CachedMessage,
    EncryptedSearchDB,
    GetUserKeys,
    LastEmail,
    MessageForSearch,
    NormalisedSearchParams,
    StoredCiphertext,
} from '../../models/encryptedSearch';
import { ES_MAX_CACHE, PAGE_SIZE } from '../../constants';
import { getNumMessagesDB, getOldestTime } from './esUtils';
import { decryptFromDB } from './esSync';
import { getIndexKey } from './esBuild';

/**
 * Normalise keyword
 */
const normaliseKeyword = (keyword: string) => {
    return keyword
        .toLocaleLowerCase()
        .split(' ')
        .filter((s) => s);
};

/**
 * Remove milliseconds from numeric value of a date
 */
const roundMilliseconds = (time: number) => Math.floor(time / 1000);

/**
 * Remove wildcard, normalise keyword and include end day
 */
export const normaliseSearchParams = (searchParams: SearchParameters, labelID: string) => {
    const { wildcard, keyword, end, to, from, ...otherParams } = searchParams;
    let normalisedKeywords: string[] | undefined;
    if (keyword) {
        normalisedKeywords = normaliseKeyword(keyword);
    }
    let roundedEnd: number | undefined;
    if (end) {
        roundedEnd = roundMilliseconds(endOfDay(end * 1000).getTime());
    }

    const normalisedSearchParams: NormalisedSearchParams = {
        ...otherParams,
        labelID,
        end: roundedEnd,
        normalisedKeywords,
        from: from ? from.toLocaleLowerCase() : undefined,
        to: to ? to.toLocaleLowerCase() : undefined,
    };

    return normalisedSearchParams;
};

/**
 * Check if keywords are in subject, Sender, body, ToList, CCList or BCCList
 */
const testKeyword = (normalisedKeywords: string[], messageToSearch: CachedMessage) => {
    const { Subject, Sender, decryptedBody, decryptedSubject, ToList, CCList, BCCList } = messageToSearch;
    const subject = decryptedSubject || Subject;

    let result = true;
    let index = 0;
    while (result && index !== normalisedKeywords.length) {
        const keyword = normalisedKeywords[index];
        result =
            result &&
            (subject.toLocaleLowerCase().includes(keyword) ||
                Sender.Address.toLocaleLowerCase().includes(keyword) ||
                Sender.Name.toLocaleLowerCase().includes(keyword) ||
                ToList.map((recipient) => recipient.Address)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                CCList.map((recipient) => recipient.Address)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                BCCList.map((recipient) => recipient.Address)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                ToList.map((recipient) => recipient.Name)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                CCList.map((recipient) => recipient.Name)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                BCCList.map((recipient) => recipient.Name)
                    .join(' ')
                    .toLocaleLowerCase()
                    .includes(keyword) ||
                (!!decryptedBody && decryptedBody.includes(keyword)));
        index++;
    }

    return result;
};

/**
 * Apply advanced search filters and search for keywords
 */
export const applySearch = (
    normalisedSearchParams: NormalisedSearchParams,
    messageToSearch: CachedMessage,
    incrementMessagesSearched?: () => void
) => {
    const { address, from, to, normalisedKeywords, begin, end, attachments, labelID, decryptionError } =
        normalisedSearchParams;

    if (
        !messageToSearch.LabelIDs.includes(labelID) ||
        (address && messageToSearch.AddressID !== address) ||
        (begin && messageToSearch.Time < begin) ||
        (end && messageToSearch.Time > end) ||
        (from &&
            !messageToSearch.Sender.Address.toLocaleLowerCase().includes(from) &&
            !messageToSearch.Sender.Name.toLocaleLowerCase().includes(from)) ||
        (typeof attachments !== 'undefined' &&
            ((attachments === 0 && messageToSearch.NumAttachments > 0) ||
                (attachments === 1 && messageToSearch.NumAttachments === 0))) ||
        (typeof decryptionError !== 'undefined' && decryptionError !== messageToSearch.decryptionError)
    ) {
        return false;
    }

    if (to) {
        let keywordFound = false;
        for (const recipient of messageToSearch.ToList) {
            keywordFound =
                keywordFound ||
                recipient.Address.toLocaleLowerCase().includes(to) ||
                recipient.Name.toLocaleLowerCase().includes(to);
        }
        if (!keywordFound) {
            return false;
        }
    }

    if (incrementMessagesSearched) {
        incrementMessagesSearched();
    }

    if (!normalisedKeywords) {
        return true;
    }

    return testKeyword(normalisedKeywords, messageToSearch);
};

/**
 * Derive the correct time boundaries to get batches of messages from IndexedDB.
 * Time intervals are around one month long
 */
export const getTimeLimits = (prevStart: number, begin: number | undefined, end: number | undefined) => {
    const endTime = prevStart ? prevStart - 1 : end || roundMilliseconds(endOfToday().getTime());
    const startTime = Math.max(
        begin || 0,
        roundMilliseconds(startOfMonth(sub(endTime * 1000, { months: 1 })).getTime())
    );

    const lower: [number, number] = [startTime, 0];
    const upper: [number, number] = [endTime, Number.MAX_SAFE_INTEGER];

    return {
        lower,
        upper,
    };
};

/**
 * Split a CachedMessage into a MessageForSearch and other fields
 */
export const splitCachedMessage = (cachedMessage: CachedMessage) => {
    const { decryptedBody, decryptedSubject, decryptionError, ...otherFields } = cachedMessage;
    const messageForSearch: MessageForSearch = { ...otherFields };
    return {
        decryptedBody,
        decryptedSubject,
        decryptionError,
        messageForSearch,
    };
};

/**
 * Initialise some helpers to query the correct time frames
 */
export const initialiseQuery = async (userID: string, begin?: number, end?: number) => {
    // Data is retrieved in batches, in such a way that decryption of earlier batches
    // can start before fetching later batches. Messages are retrieved in reverse chronological order.
    // Initial time represents the oldest moment in time the search has to go back to. It is
    // "begin" if specified, otherwise it's the oldest date in IndexedDB
    const initialTime = begin || (await getOldestTime(userID));
    const getTimes = (start: number) => getTimeLimits(start, initialTime, end);
    return { getTimes, initialTime };
};

/**
 * Initialise some variables for the query
 */
export const initialiseVariables = (beginOrder: number | undefined) => {
    const lower: [number, number] = [0, 0];
    const upper: [number, number] = [0, 0];
    const startingOrder = beginOrder ? beginOrder - 1 : undefined;
    return { lower, upper, startingOrder };
};

/**
 * Fetch a new batch of messages from IDB
 */
export const queryNewData = async (
    getTimes: (start: number) => {
        lower: [number, number];
        upper: [number, number];
    },
    lower: [number, number],
    upper: [number, number],
    startingOrder: number | undefined,
    esDB: IDBPDatabase<EncryptedSearchDB>
) => {
    const bounds = getTimes(lower[0]);
    ({ lower, upper } = bounds);
    if (startingOrder) {
        upper[1] = startingOrder;
        startingOrder = undefined;
    }

    const storedData = await esDB.getAllFromIndex('messages', 'byTime', IDBKeyRange.bound(lower, upper));
    return { lower, upper, startingOrder, storedData };
};

/**
 * Perfom an uncached search, i.e. fetching and searching messages from IndexedDB
 */
export const uncachedSearch = async (
    indexKey: CryptoKey,
    userID: string,
    normalisedSearchParams: NormalisedSearchParams,
    options: {
        incrementMessagesSearched?: () => void;
        messageLimit?: number;
        setCache?: (newResults: MessageForSearch[]) => void;
        beginOrder?: number;
    }
) => {
    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);
    const { incrementMessagesSearched, messageLimit, beginOrder, setCache } = options;
    const { getTimes, initialTime } = await initialiseQuery(
        userID,
        normalisedSearchParams.begin,
        normalisedSearchParams.end
    );
    const resultsArray: MessageForSearch[] = [];

    let { lower, upper, startingOrder } = initialiseVariables(beginOrder);
    let lastEmail: LastEmail | undefined;

    while (!lastEmail) {
        let storedData: StoredCiphertext[];
        ({ lower, upper, startingOrder, storedData } = await queryNewData(getTimes, lower, upper, startingOrder, esDB));

        for (let index = storedData.length - 1; index >= 0; index--) {
            const storedCiphertext = storedData[index];
            if (!storedCiphertext.LabelIDs.includes(normalisedSearchParams.labelID)) {
                continue;
            }
            const messageToSearch = await decryptFromDB(storedCiphertext, indexKey);
            if (!messageToSearch) {
                continue;
            }
            if (applySearch(normalisedSearchParams, messageToSearch, incrementMessagesSearched)) {
                const { messageForSearch } = splitCachedMessage(messageToSearch);
                resultsArray.push(messageForSearch);
            }
            if (messageLimit && resultsArray.length >= messageLimit) {
                lastEmail = { Time: storedCiphertext.Time, Order: storedCiphertext.Order };
                break;
            }
        }

        if (lower[0] === initialTime) {
            break;
        }

        if (setCache && resultsArray.length > 0) {
            setCache(resultsArray);
        }
    }

    esDB.close();

    return { resultsArray, lastEmail };
};

/**
 * Estimate the size of a CachedMessage object
 */
export const sizeOfCachedMessage = (cachedMessage: CachedMessage) => {
    const sizeOfRecipient = (recipient: Recipient) => {
        let innerBytes = 0;
        let innerKey: keyof typeof recipient;
        for (innerKey in recipient) {
            if (Object.prototype.hasOwnProperty.call(recipient, innerKey)) {
                const innerValue = recipient[innerKey];
                if (!innerValue) {
                    continue;
                }
                innerBytes += (innerKey.length + innerValue.length) * 2;
            }
        }
        return innerBytes;
    };

    let bytes = 0;
    let key: keyof typeof cachedMessage;

    for (key in cachedMessage) {
        if (Object.prototype.hasOwnProperty.call(cachedMessage, key)) {
            const value = cachedMessage[key];
            if (!value) {
                continue;
            }

            bytes += key.length * 2;

            if (typeof value === 'boolean') {
                bytes += 4;
            } else if (typeof value === 'string') {
                bytes += value.length * 2;
            } else if (typeof value === 'number') {
                bytes += 8;
            } else if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    const innerValue = value[i];
                    if (typeof innerValue === 'string') {
                        bytes += innerValue.length * 2;
                    } else {
                        bytes += sizeOfRecipient(innerValue);
                    }
                }
            } else {
                bytes += sizeOfRecipient(value);
            }
        }
    }

    return bytes;
};

/**
 * Check whether the cache is limited
 */
export const checkIsCacheLimited = async (userID: string, esCacheLength: number) => {
    const count = await getNumMessagesDB(userID);
    return esCacheLength < count;
};

/**
 * Callback to sort cached messages by Time and Order
 */
export const sortCachedMessages = (firstEl: CachedMessage, secondEl: CachedMessage) => {
    return firstEl.Time - secondEl.Time || firstEl.Order - secondEl.Order;
};

/**
 * Cache IndexedDB
 */
export const cacheDB = async (
    indexKey: CryptoKey,
    userID: string,
    cacheLimit: number = ES_MAX_CACHE,
    endTime?: number,
    beginOrder?: number
) => {
    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);

    // If IDB is empty, there is nothing to cache
    if ((await esDB.count('messages')) === 0) {
        return {
            cachedMessages: [],
            isCacheLimited: false,
        };
    }

    const { getTimes, initialTime } = await initialiseQuery(userID, undefined, endTime);
    const cachedMessages: CachedMessage[] = [];
    let cacheSize = 0;
    let isCacheLimited = false;

    let { lower, upper, startingOrder } = initialiseVariables(beginOrder);

    while (!isCacheLimited) {
        let storedData: StoredCiphertext[];
        ({ lower, upper, startingOrder, storedData } = await queryNewData(getTimes, lower, upper, startingOrder, esDB));

        for (let index = storedData.length - 1; index >= 0; index--) {
            const storedCiphertext = storedData[index];
            const messageToCache = await decryptFromDB(storedCiphertext, indexKey);
            if (!messageToCache) {
                continue;
            }
            cacheSize += sizeOfCachedMessage(messageToCache);
            if (cacheSize < cacheLimit) {
                cachedMessages.push(messageToCache);
            } else {
                isCacheLimited = true;
                break;
            }
        }

        if (lower[0] === initialTime) {
            break;
        }
    }

    esDB.close();

    // Sort the cached messages by time, such that the first element is the oldest
    cachedMessages.sort(sortCachedMessages);

    return {
        cachedMessages,
        isCacheLimited,
    };
};

/**
 * Fills a partial cache with new messages from IDB
 */
export const updateCache = async (
    indexKey: CryptoKey,
    userID: string,
    lastEmail: LastEmail,
    esCache: CachedMessage[],
    cacheLimit: number
) => {
    const { cachedMessages } = await cacheDB(indexKey, userID, cacheLimit, lastEmail.Time, lastEmail.Order);
    esCache.push(...cachedMessages);
    esCache.sort(sortCachedMessages);
};

/**
 * Estimate the size of the entire cache
 */
export const sizeOfCache = (esCache: CachedMessage[]) => {
    let size = 0;
    esCache.forEach((cachedMessage) => {
        size += sizeOfCachedMessage(cachedMessage);
    });
    return size;
};

/**
 * Perfom an cached search, i.e. over the given messages only
 */
export const cachedSearch = async (
    esCache: CachedMessage[],
    normalisedSearchParams: NormalisedSearchParams,
    incrementMessagesSearched: () => void
) => {
    const searchResults: MessageForSearch[] = [];

    esCache.forEach((messageToSearch: CachedMessage) => {
        if (applySearch(normalisedSearchParams, messageToSearch, incrementMessagesSearched)) {
            const { messageForSearch } = splitCachedMessage(messageToSearch);
            searchResults.push(messageForSearch);
        }
    });

    return searchResults;
};

/**
 * Helper to perfom an uncached search from an hybrid search
 */
const uncachedFromHybrid = async (
    normalisedSearchParams: NormalisedSearchParams,
    getUserKeys: GetUserKeys,
    userID: string,
    incrementMessagesSearched: () => void,
    messageLimit: number,
    setCache: (newResults: MessageForSearch[]) => void
) => {
    const indexKey = await getIndexKey(getUserKeys, userID);
    if (!indexKey) {
        throw new Error('Key not found');
    }

    return uncachedSearch(indexKey, userID, normalisedSearchParams, {
        incrementMessagesSearched,
        messageLimit,
        setCache,
    });
};

/**
 * Perform a search by switching between cached and uncached search when necessary
 */
export const hybridSearch = async (
    esCache: CachedMessage[],
    normalisedSearchParams: NormalisedSearchParams,
    isCacheLimited: boolean,
    getUserKeys: GetUserKeys,
    userID: string,
    incrementMessagesSearched: () => void,
    setCache: (Elements: Element[]) => void
) => {
    let searchResults: MessageForSearch[] = [];
    let isSearchPartial = false;
    let lastEmail: LastEmail | undefined;

    if (esCache.length) {
        searchResults = await cachedSearch(esCache, normalisedSearchParams, incrementMessagesSearched);

        if (isCacheLimited) {
            // If enough messages to fill two pages were already found, we don't continue the search
            if (searchResults.length >= 2 * PAGE_SIZE) {
                const lastEmailInCache: LastEmail = { Time: esCache[0].Time, Order: esCache[0].Order };
                return { searchResults, isSearchPartial: true, lastEmail: lastEmailInCache };
            }

            // The remaining messages are searched from DB, but only if the indicated timespan
            // hasn't been already covered by cache. If isCacheLimited is true, the cache is
            // ordered such that the first message is the oldest
            const startCache = esCache[0].Time;
            const intervalEnd = Math.min(startCache - 1, normalisedSearchParams.end || Number.MAX_SAFE_INTEGER);
            const intervalStart = normalisedSearchParams.begin || 0;

            if (intervalStart < startCache) {
                if (searchResults.length > 0) {
                    setCache(searchResults);
                }

                const remainingMessages = 2 * PAGE_SIZE - searchResults.length;

                const setCacheIncremental = (newResults: MessageForSearch[]) => {
                    setCache(searchResults.concat(newResults));
                };

                const uncachedResult = await uncachedFromHybrid(
                    {
                        ...normalisedSearchParams,
                        begin: intervalStart,
                        end: intervalEnd,
                    },
                    getUserKeys,
                    userID,
                    incrementMessagesSearched,
                    remainingMessages,
                    setCacheIncremental
                );
                searchResults.push(...uncachedResult.resultsArray);
                lastEmail = uncachedResult.lastEmail;
                isSearchPartial = !!lastEmail;
            }
        }
    } else {
        // This is used if the cache is empty
        const uncachedResult = await uncachedFromHybrid(
            normalisedSearchParams,
            getUserKeys,
            userID,
            incrementMessagesSearched,
            2 * PAGE_SIZE,
            setCache
        );
        searchResults = uncachedResult.resultsArray;
        lastEmail = uncachedResult.lastEmail;
        isSearchPartial = !!lastEmail;
    }

    return { searchResults, isSearchPartial, lastEmail };
};
