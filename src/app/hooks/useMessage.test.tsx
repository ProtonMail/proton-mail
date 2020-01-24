import { renderHook, act } from '@testing-library/react-hooks';
import { useApi } from 'react-components';
import { wait } from 'proton-shared/lib/helpers/promise';
import { noop } from 'proton-shared/lib/helpers/function';

import { useMessage } from './useMessage';
import * as UseMessageCache from './useMessageCache';
import { Cache } from '../models/utils';
import { MessageExtended } from '../models/message';

// Needed to make TS accepts the mock exports
const cacheMock: Cache<string, MessageExtended> = (UseMessageCache as any).cacheMock;

jest.mock('./useMessageCache');
jest.mock('./useDecryptMessage', () => ({ useDecryptMessage: jest.fn() }));
jest.mock('./useAttachments', () => ({ useAttachmentsCache: jest.fn() }));
jest.mock('./useEncryptMessage', () => ({ useEncryptMessage: jest.fn(() => (m: any) => m) }));
jest.mock('./useSendMessage', () => ({ useSendMessage: jest.fn(() => (m: any) => m) }));

describe('useMessage', () => {
    let consoleError: any;

    const ID = 'ID';

    const api = jest.fn();
    (useApi as jest.Mock).mockReturnValue(api);

    const setup = () => {
        const renderHookResult = renderHook((props: any = {}) => useMessage({ ID, ...props }, {}));
        return renderHookResult.result;
    };

    beforeAll(() => {
        consoleError = console.error;
        console.error = noop;
    });

    afterAll(() => {
        console.error = consoleError;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('message state', () => {
        it('should initialize message in cache if not existing', () => {
            const result = setup();
            expect(result.current[0]).toEqual({ data: { ID } });
        });

        it('should returns message from the cache', () => {
            const message = {};
            cacheMock.set(ID, message);
            const result = setup();
            expect(result.current[0]).toBe(message);
        });
    });

    describe('message actions', () => {
        it('should wait the computations to resolve the promise', async () => {
            let resolve: (arg: any) => void = noop;
            api.mockReturnValue(
                new Promise((r) => {
                    resolve = r;
                })
            );
            const result = setup();
            const promise = act(async () => {
                await result.current[1].createDraft({});
            });
            expect(result.current[2].lock).toBe(true);
            await wait(0);
            expect(result.current[2].lock).toBe(true);
            resolve({ Message: {} });
            expect(result.current[2].lock).toBe(true);
            await wait(0);
            expect(result.current[2].lock).toBe(true);
            await promise;
            expect(result.current[2].lock).toBe(false);
        });

        it('should create a draft with an api call', async () => {
            const Message = {};
            api.mockResolvedValue({ Message });
            const result = setup();
            await act(async () => {
                await result.current[1].createDraft({});
            });
            expect(result.current[0].data).toEqual({ ID });
            expect(api).toHaveBeenCalled();
        });
    });
});
