import { RenderHookResult, act } from '@testing-library/react-hooks';
import { range } from 'proton-shared/lib/helpers/array';
import { queryConversations } from 'proton-shared/lib/api/conversations';
import { wait } from 'proton-shared/lib/helpers/promise';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import loudRejection from 'loud-rejection';
import { useElements } from './useElements';
import { Element } from '../../models/element';
import { Sort, Filter, SearchParameters } from '../../models/tools';
import {
    renderHook,
    clearAll,
    addApiMock,
    api,
    triggerEvent,
    addApiResolver,
    addToCache,
} from '../../helpers/test/helper';
import { ConversationLabel, Conversation } from '../../models/conversation';
import { Event } from '../../models/event';
import { ELEMENTS_CACHE_REQUEST_SIZE, PAGE_SIZE } from '../../constants';

loudRejection();

interface SetupArgs {
    elements?: Element[];
    conversationMode?: boolean;
    inputLabelID?: string;
    page?: number;
    total?: number;
    sort?: Sort;
    filter?: Filter;
    search?: SearchParameters;
}

describe('useElements', () => {
    const labelID = 'labelID';
    const element1 = { ID: 'id1', Labels: [{ ID: labelID, ContextTime: 1 }], LabelIDs: [labelID], Size: 20 } as Element;
    const element2 = { ID: 'id2', Labels: [{ ID: labelID, ContextTime: 2 }], LabelIDs: [labelID], Size: 10 } as Element;
    const element3 = {
        ID: 'id3',
        Labels: [{ ID: 'otherLabelID', ContextTime: 3 }],
        LabelIDs: ['otherLabelID'],
    } as Element;
    const defaultSort = { sort: 'Time', desc: true } as Sort;
    const defaultFilter = {};
    const defaultSearch = {};

    const getElements = (count: number, label = labelID, elementProps: any = {}): Element[] =>
        range(0, count).map((i) => ({
            ID: `id${i}`,
            Labels: [{ ID: label, ContextTime: i }] as ConversationLabel[],
            LabelIDs: [label],
            ...elementProps,
        }));

    let renderHookResult: RenderHookResult<any, any> | null = null;

    const setup = async ({
        elements = [],
        conversationMode = true,
        inputLabelID = labelID,
        page = 0,
        total = elements.length,
        sort = defaultSort,
        filter = defaultFilter,
        search = defaultSearch,
    }: SetupArgs = {}) => {
        const pageFromUrl = page;
        const counts = { LabelID: inputLabelID, Total: total };
        addToCache('ConversationCounts', conversationMode ? [counts] : []);
        addToCache('MessageCounts', conversationMode ? [] : [counts]);
        addApiMock('mail/v4/conversations', () => ({ Total: total, Conversations: elements }));

        if (renderHookResult === null) {
            renderHookResult = renderHook((props: any = {}) =>
                useElements({ conversationMode, labelID: inputLabelID, pageFromUrl, sort, filter, search, ...props })
            );
            await renderHookResult.waitForNextUpdate();
        } else {
            renderHookResult.rerender({ conversationMode, labelID: inputLabelID, pageFromUrl, sort, filter });
        }

        return renderHookResult;
    };

    const sendEvent = async (event: Event) => {
        await act(async () => {
            triggerEvent(event);
            await wait(0);
        });
    };

    beforeEach(() => {
        renderHookResult = null;
        clearAll();
    });

    describe('elements memo', () => {
        it('should order by label context time', async () => {
            const hook = await setup({ elements: [element1, element2] });
            expect(hook.result.current.elements).toEqual([element2, element1]);
        });

        it('should filter message with the right label', async () => {
            const hook = await setup({
                page: 0,
                total: 2,
                elements: [element1, element2, element3],
            });
            expect(hook.result.current.elements.length).toBe(2);
        });

        it('should limit to the page size', async () => {
            const total = PAGE_SIZE + 5;
            const hook = await setup({ elements: getElements(total), page: 0, total });
            expect(hook.result.current.elements.length).toBe(PAGE_SIZE);
        });

        it('should returns the current page', async () => {
            const page1 = 0;
            const page2 = 1;
            const total = PAGE_SIZE + 2;
            const allElements = getElements(total);

            const hook = await setup({ elements: allElements.slice(0, PAGE_SIZE), page: page1, total });
            await act(async () => {
                await setup({ elements: allElements.slice(PAGE_SIZE), page: page2, total });
            });
            expect(hook.result.current.elements.length).toBe(total - PAGE_SIZE);
        });

        it('should returns elements sorted', async () => {
            const elements = [element1, element2];
            const sort1: Sort = { sort: 'Size', desc: false };
            const sort2: Sort = { sort: 'Size', desc: true };

            let hook = await setup({ elements, sort: sort1 });
            expect(hook.result.current.elements).toEqual([element2, element1]);

            await act(async () => {
                hook = await setup({ elements, sort: sort2 });
            });
            expect(hook.result.current.elements).toEqual([element1, element2]);
        });
    });

    describe('request effect', () => {
        it('should send request for conversations current page', async () => {
            const page = 0;
            const total = PAGE_SIZE + 3;
            const expectedRequest = {
                ...queryConversations({
                    LabelID: labelID,
                    Sort: 'Time',
                    Limit: ELEMENTS_CACHE_REQUEST_SIZE,
                    PageSize: PAGE_SIZE,
                } as any),
                signal: new AbortController().signal,
            };

            const result = await setup({ elements: getElements(PAGE_SIZE), page, total });

            expect(api).toHaveBeenCalledWith(expectedRequest);

            const { labelID: resultLabelID, elements, loading, total: resultTotal } = result.result.current;

            expect(resultLabelID).toBe(labelID);
            expect(elements.length).toBe(PAGE_SIZE);
            expect(loading).toBe(false);
            expect(resultTotal).toBe(total);
        });
    });

    describe('event handling', () => {
        it('should add to the cache a message which is not existing yet', async () => {
            // Usefull to receive incoming mail or draft without having to reload the list

            const page = 0;
            const total = 3;
            const hook = await setup({ elements: getElements(total), page });

            const element = { ID: 'id3', Labels: [{ ID: labelID }], LabelIDs: [labelID] };
            await sendEvent({
                ConversationCounts: [{ LabelID: labelID, Total: total + 1, Unread: 0 }],
                Conversations: [
                    { ID: element.ID, Action: EVENT_ACTIONS.CREATE, Conversation: element as Conversation },
                ],
            });
            expect(hook.result.current.elements.length).toBe(4);
        });

        it('should not add to the cache a message which is not existing when a search is active', async () => {
            // When a search is active, all the cache will be shown, we can't accept any updated message
            // But we will refresh the request each time

            const page = 0;
            const total = 3;
            const search = { keyword: 'test' } as SearchParameters;
            const hook = await setup({ elements: getElements(total), page, search });

            const element = { ID: 'id3', Labels: [{ ID: labelID }], LabelIDs: [labelID] };
            await sendEvent({
                Conversations: [
                    { ID: element.ID, Action: EVENT_ACTIONS.CREATE, Conversation: element as Conversation },
                ],
            });
            expect(hook.result.current.elements.length).toBe(3);
            expect(api.mock.calls.length).toBe(2);
        });

        it('should not reload the list on an update event if a filter is active', async () => {
            const page = 0;
            const total = 3;
            const filter = { Unread: 1 } as Filter;
            const elements = getElements(total, labelID, { NumUnread: 1 });

            const hook = await setup({ elements, page, filter });

            const ID = 'id0';
            await sendEvent({
                Conversations: [{ ID, Action: EVENT_ACTIONS.UPDATE, Conversation: { ID } as Conversation }],
            });
            expect(hook.result.current.elements.length).toBe(3);
            expect(api.mock.calls.length).toBe(1);
        });

        it('should not reload the list on an update event if has list from start', async () => {
            const page = 0;
            const total = 3;
            const hook = await setup({ elements: getElements(total), page });

            const ID = 'id0';
            await sendEvent({
                Conversations: [{ ID, Action: EVENT_ACTIONS.UPDATE, Conversation: { ID } as Conversation }],
            });
            expect(hook.result.current.elements.length).toBe(3);
            expect(api.mock.calls.length).toBe(1);
        });

        it('should reload the list on an update event if has not list from start', async () => {
            const page = 2;
            const total = PAGE_SIZE * 6 + 2;
            const hook = await setup({ elements: getElements(PAGE_SIZE), page, total });

            const ID = 'id0';
            await sendEvent({
                Conversations: [{ ID, Action: EVENT_ACTIONS.UPDATE, Conversation: { ID } as Conversation }],
            });
            expect(hook.result.current.elements.length).toBe(PAGE_SIZE);
            expect(api.mock.calls.length).toBe(2);
        });

        it('should reload the list on an delete event if a search is active', async () => {
            const page = 0;
            const total = 3;
            const search = { keyword: 'test' } as SearchParameters;
            const hook = await setup({ elements: getElements(total), page, search });

            const ID = 'id10';
            await sendEvent({
                Conversations: [{ ID, Action: EVENT_ACTIONS.DELETE, Conversation: { ID } as Conversation }],
            });
            expect(hook.result.current.elements.length).toBe(3);
            expect(api.mock.calls.length).toBe(2);
        });

        it('should reload the list on count event and expected length not matched', async () => {
            // The updated counter should trigger a check on the expected length

            const page = 0;
            const total = 3;
            const elements = getElements(total);
            await setup({ elements, page });

            await sendEvent({
                ConversationCounts: [{ LabelID: labelID, Total: 10, Unread: 10 }],
            });

            expect(api.mock.calls.length).toBe(2);
        });

        it('should not reload the list on count event when a search is active', async () => {
            // If a search is active, the expected length computation has no meaning

            const page = 0;
            const total = 3;
            const search = { keyword: 'test' } as SearchParameters;
            const elements = getElements(total);
            await setup({ elements, page, search });

            await sendEvent({
                ConversationCounts: [{ LabelID: labelID, Total: 10, Unread: 10 }],
            });

            expect(api.mock.calls.length).toBe(1);
        });

        it('should reload the list if the last element has been updated', async () => {
            // If the last element of the list has been updated by an event
            // We're not sure that the sort is good so the cache has to be reset

            const setTime = (element: Element, time: number) => {
                ((element as Conversation).Labels as ConversationLabel[])[0].ContextTime = time;
                return element;
            };

            const page = 0;
            const total = PAGE_SIZE;
            const elements = getElements(total);
            elements.forEach((element, i) => setTime(element, i + 10));
            await setup({ elements, page });

            const element = setTime({ ...elements[4] }, 0);
            await sendEvent({
                Conversations: [{ ID: element.ID || '', Action: EVENT_ACTIONS.UPDATE_FLAGS, Conversation: element }],
            });

            expect(api.mock.calls.length).toBe(2);
        });

        it('should not show the loader if not live cache but params has not changed', async () => {
            addApiMock('mail/v4/messages/count', () => ({}));
            addApiMock('mail/v4/conversations/count', () => ({}));
            const resolve = addApiResolver('mail/v4/conversations');

            const page = 0;
            const total = PAGE_SIZE;
            const search = { keyword: 'test' } as SearchParameters;
            const elements = getElements(total);

            const hook = renderHook((props: any = {}) =>
                useElements({
                    conversationMode: true,
                    labelID,
                    pageFromUrl: page,
                    sort: defaultSort,
                    filter: defaultFilter,
                    search,
                    ...props,
                })
            );

            // First load pending
            expect(hook.result.current.loading).toBe(true);

            resolve({ Total: total, Conversations: elements });

            await hook.waitForNextUpdate();

            // First load finished
            expect(hook.result.current.loading).toBe(false);

            const element = elements[0];
            await sendEvent({
                Conversations: [{ ID: element.ID || '', Action: EVENT_ACTIONS.UPDATE_FLAGS, Conversation: element }],
            });

            // Event triggered a reload, load is pending but it's hidded to the user
            expect(hook.result.current.loading).toBe(false);
            expect(hook.result.current.elements.length).toBe(PAGE_SIZE);

            await act(async () => {
                resolve({ Total: total, Conversations: elements });
                await wait(0);
            });

            // Load finished
            expect(hook.result.current.loading).toBe(false);
        });

        it('should show the loader if not live cache and params has changed', async () => {
            addApiMock('mail/v4/messages/count', () => ({}));
            addApiMock('mail/v4/conversations/count', () => ({}));
            const resolve = addApiResolver('mail/v4/conversations');

            const page = 0;
            const total = PAGE_SIZE;
            const search = { keyword: 'test' } as SearchParameters;
            const elements = getElements(total);

            const hook = renderHook((props: any = {}) =>
                useElements({
                    conversationMode: true,
                    labelID,
                    pageFromUrl: page,
                    sort: defaultSort,
                    filter: defaultFilter,
                    search,
                    ...props,
                })
            );

            // First load pending
            expect(hook.result.current.loading).toBe(true);

            resolve({ Total: total, Conversations: elements });

            await hook.waitForNextUpdate();

            // First load finished
            expect(hook.result.current.loading).toBe(false);

            hook.rerender({ search: { keyword: 'changed' } as SearchParameters });

            // Params has changed, cache is reseted
            expect(hook.result.current.loading).toBe(true);
            expect(hook.result.current.elements.length).toBe(0);

            await act(async () => {
                resolve({ Total: total, Conversations: elements });
                await wait(0);
            });

            // Load finished
            expect(hook.result.current.loading).toBe(false);
        });
    });
});
