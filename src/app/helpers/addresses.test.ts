import { findSender } from './addresses';

describe('addresses', () => {
    describe('findSender', () => {
        it('should return empty for no message no addresses', () => {
            const result = findSender();
            expect(result).toBe(undefined);
        });

        it('should return empty for no addresses', () => {
            const result = findSender([], { AddressID: '1' });
            expect(result).toBe(undefined);
        });

        it('should return empty if no match', () => {
            const result = findSender([{ Status: 2 }], { AddressID: '1' });
            expect(result).toBe(undefined);
        });

        it('should return first if addresses valid but no match', () => {
            const first = { Status: 1, Order: 1, ID: '2' };
            const result = findSender([{ Status: 2 }, first, { Status: 1, Order: 2, ID: '3' }], { AddressID: '1' });
            expect(result).toBe(first);
        });

        it('should return first if addresses order valid but no match', () => {
            const first = { Status: 1, Order: 1, ID: '2' };
            const result = findSender([{ Status: 2, Order: 0, ID: '1' }, first, { Status: 1, Order: 2, ID: '3' }], {
                AddressID: '1'
            });
            expect(result).toEqual(first);
        });

        it('should return the match over order', () => {
            const match = { Status: 1, Order: 2, ID: '1' };
            const result = findSender([{ Status: 2 }, match, { Status: 1, Order: 1, ID: '2' }], {
                AddressID: '1'
            });
            expect(result).toBe(match);
        });
    });
});
