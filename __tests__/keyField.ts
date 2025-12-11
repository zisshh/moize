import moize from '../src';

type Item = {
    id: string;
    name: string;
    value: number;
};

const processItems = jest.fn(function (items: Item[]) {
    return items.map((item) => item.id).sort().join(',');
});

const sumItems = jest.fn(function (items: Item[]) {
    return items.reduce((sum, item) => sum + item.value, 0);
});

describe('moize.keyField', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('with string keyField (property name)', () => {
        const memoized = moize.keyField('id')(processItems);

        afterEach(() => {
            memoized.clear();
        });

        it('should cache based on element identity, not array reference', () => {
            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);
        });

        it('should hit same cache entry for arrays with same elements in different order', () => {
            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'b', name: 'Item B', value: 2 },
                { id: 'a', name: 'Item A', value: 1 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);
        });

        it('should create different cache entries for arrays with different elements', () => {
            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'c', name: 'Item C', value: 3 },
                { id: 'd', name: 'Item D', value: 4 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            expect(result1).not.toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(2);
        });

        it('should ignore non-key fields and cache-hit when keyField values match', () => {
            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'a', name: 'Item A Modified', value: 999 },
                { id: 'b', name: 'Item B Changed', value: 888 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            // Should hit cache even though name and value differ
            // because id (keyField) values are the same
            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);
        });

        it('should cache arrays with different element sets separately', () => {
            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
                { id: 'c', name: 'Item C', value: 3 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            // Different element sets should produce different cache entries
            expect(result1).not.toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(2);

            // Calling with same arrays should hit cache
            const result3 = memoized(items1);
            const result4 = memoized(items2);

            expect(result3).toBe(result1);
            expect(result4).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(2);
        });
    });

    describe('with function keyField (key extractor)', () => {
        const memoized = moize.keyField((item: Item) => item.id)(processItems);

        afterEach(() => {
            memoized.clear();
        });

        it('should cache based on element identity using key extractor', () => {
            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);
        });

        it('should hit same cache entry for arrays with same elements in different order', () => {
            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'b', name: 'Item B', value: 2 },
                { id: 'a', name: 'Item A', value: 1 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);
        });

        it('should work with complex key extraction', () => {
            const complexMemoized = moize.keyField(
                (item: Item) => `${item.id}-${item.value}`
            )(sumItems);

            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];

            const result1 = complexMemoized(items1);
            const result2 = complexMemoized(items2);

            expect(result1).toBe(result2);
            expect(sumItems).toHaveBeenCalledTimes(1);

            complexMemoized.clear();
        });

        it('should ignore non-key fields when using function keyField', () => {
            const memoized = moize.keyField((item: Item) => item.id)(processItems);

            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'a', name: 'Completely Different Name', value: 999 },
                { id: 'b', name: 'Another Different Name', value: 888 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            // Should hit cache even though name and value differ
            // because keyField extractor returns same values
            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);

            memoized.clear();
        });
    });

    describe('with options object syntax', () => {
        it('should work with keyField in options object', () => {
            const memoized = moize(processItems, { keyField: 'id' });

            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'b', name: 'Item B', value: 2 },
                { id: 'a', name: 'Item A', value: 1 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);

            memoized.clear();
        });

        it('should work with function keyField in options object', () => {
            const memoized = moize(processItems, {
                keyField: (item: Item) => item.id,
            });

            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'b', name: 'Item B', value: 2 },
                { id: 'a', name: 'Item A', value: 1 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);

            memoized.clear();
        });
    });

    describe('integration with existing options', () => {
        it('should work with isDeepEqual', () => {
            const memoized = moize(processItems, {
                keyField: 'id',
                isDeepEqual: true,
            });

            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'b', name: 'Item B', value: 2 },
                { id: 'a', name: 'Item A', value: 1 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);

            memoized.clear();
        });

        it('should work with isShallowEqual', () => {
            const memoized = moize(processItems, {
                keyField: 'id',
                isShallowEqual: true,
            });

            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'b', name: 'Item B', value: 2 },
                { id: 'a', name: 'Item A', value: 1 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);

            memoized.clear();
        });

        it('should work with transformArgs', () => {
            const memoized = moize(processItems, {
                keyField: 'id',
                transformArgs: (args: [Item[]]) => args,
            });

            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'b', name: 'Item B', value: 2 },
            ];
            const items2 = [
                { id: 'b', name: 'Item B', value: 2 },
                { id: 'a', name: 'Item A', value: 1 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);

            memoized.clear();
        });

        it('should work with maxSize (LRU eviction)', () => {
            const memoized = moize(processItems, {
                keyField: 'id',
                maxSize: 2,
            });

            const items1 = [{ id: 'a', name: 'Item A', value: 1 }];
            const items2 = [{ id: 'b', name: 'Item B', value: 2 }];
            const items3 = [{ id: 'c', name: 'Item C', value: 3 }];

            // Fill cache to maxSize (2 entries)
            memoized(items1);
            memoized(items2);
            expect(processItems).toHaveBeenCalledTimes(2);

            // Adding third item should evict least recently used (items1)
            memoized(items3);
            expect(processItems).toHaveBeenCalledTimes(3);

            // items1 was evicted, so it should be called again
            memoized(items1);
            expect(processItems).toHaveBeenCalledTimes(4);

            // items2 should still be cached (was more recently used than items1)
            const result2 = memoized(items2);
            expect(processItems).toHaveBeenCalledTimes(4);

            memoized.clear();
        });
    });

    describe('edge cases', () => {
        it('should handle empty arrays', () => {
            const memoized = moize.keyField('id')(processItems);

            const result1 = memoized([]);
            const result2 = memoized([]);

            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);

            memoized.clear();
        });

        it('should handle arrays with duplicate keys', () => {
            const memoized = moize.keyField('id')(processItems);

            const items1 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'a', name: 'Item A Duplicate', value: 2 },
            ];
            const items2 = [
                { id: 'a', name: 'Item A', value: 1 },
                { id: 'a', name: 'Item A Duplicate', value: 2 },
            ];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            // Should still cache based on key identity
            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);

            memoized.clear();
        });

        it('should handle single element arrays', () => {
            const memoized = moize.keyField('id')(processItems);

            const items1 = [{ id: 'a', name: 'Item A', value: 1 }];
            const items2 = [{ id: 'a', name: 'Item A', value: 1 }];

            const result1 = memoized(items1);
            const result2 = memoized(items2);

            expect(result1).toBe(result2);
            expect(processItems).toHaveBeenCalledTimes(1);

            memoized.clear();
        });
    });
});

