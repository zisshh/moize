# Fix Plan for Failing keyField Tests

## Problem Analysis

### Test 1: "should cache arrays with different element sets separately"
**Expected Behavior:**
- Call 1: `memoized(items1)` → processItems called (1 call)
- Call 2: `memoized(items2)` → processItems called (2 calls total)
- Call 3: `memoized(items1)` → cache hit, processItems NOT called (still 2 calls) ✗
- Call 4: `memoized(items2)` → cache hit, processItems NOT called (still 2 calls) ✗

**Actual Behavior:**
- Calls 3 and 4 are NOT hitting the cache, resulting in 4 total calls instead of 2

### Test 2: "should work with maxSize (LRU eviction)"
**Expected Behavior:**
- Calls 1-4 work correctly
- Call 5: `memoized(items2)` → cache hit, processItems NOT called (still 4 calls) ✗

**Actual Behavior:**
- Call 5 is NOT hitting the cache, resulting in 5 total calls instead of 4

## Root Cause Analysis

From the debugging output, we can see that:
1. `isMatchingKey` IS being called and returns `true` correctly
2. The transform creates consistent keys: `[['a', 'b']]` for items1, `[['a', 'b', 'c']]` for items2
3. `deepEqual` works correctly for nested arrays

**The Issue:**
Even though `isMatchingKey` is provided and returns `true`, micro-memoize might not be using it correctly, OR there's an issue with how the keys are being stored/retrieved.

Looking at the micro-memoize source code:
- When `isMatchingKey` is provided, it uses `_getKeyIndexFromMatchingKey`
- This method calls `isMatchingKey(keys[index], keyToMatch)` where both are transformed keys
- The method should return the index if a match is found

**Hypothesis:**
The issue might be that micro-memoize is not correctly using `isMatchingKey` when `transformKey` is also provided, OR there's a bug in how it handles the combination of these two options.

## Root Cause (Updated)

From the debugging test, we can see that:
- `isMatchingKey` IS being called correctly
- It returns `true` when keys match
- The cache keys are stored correctly as transformed keys

**However**, the actual failing tests show that the function is still being called even when `isMatchingKey` should return `true`.

**Key Insight:**
Looking at the micro-memoize source code more carefully:
- When `isMatchingKey` is provided AND `transformKey` is provided, micro-memoize uses `_getKeyIndexFromMatchingKey`
- This method compares `keys[index]` (stored key) with `keyToMatch` (transformed lookup key)
- Both should be transformed keys, so `isMatchingKey` should work

**The Real Issue:**
The problem might be that micro-memoize is not correctly handling the case where `isMatchingKey` is provided. OR, there might be an issue with how the keys are being compared when they're nested arrays.

**Alternative Hypothesis:**
Maybe the issue is that `deepEqual` from `fast-equals` is not working correctly with the specific structure of the transformed keys, OR there's a reference equality issue.

## Solution Plan

### Primary Approach: Remove custom isMatchingKey, rely on default
The default `isMatchingKey` (created in `createFindKeyIndex` in `src/utils.ts`) uses `isEqual` for each argument. Since we're already setting `isEqual` to `deepEqual` when `keyField` is used, the default should work correctly.

**Why this might work:**
- The default `isMatchingKey` iterates through each argument and uses `isEqual` to compare
- With `isEqual` set to `deepEqual`, it will correctly compare nested arrays
- This avoids potential issues with providing a custom `isMatchingKey` that might not be used correctly by micro-memoize

### Alternative Approach: Fix the custom isMatchingKey
If removing it doesn't work, we need to ensure the custom `isMatchingKey` is working correctly:
- Verify it's being called by micro-memoize
- Ensure it's comparing the correct keys (both transformed)
- Check if there's a reference equality issue

## Implementation Steps

1. **Remove custom `isMatchingKey` from `getIsMatchingKey`**
   - When `keyField` is used, don't provide a custom `isMatchingKey`
   - Let micro-memoize use the default behavior
   - The default will use `isEqual` (which is `deepEqual`) for each argument

2. **Verify `isEqual` is correctly set to `deepEqual`**
   - Ensure the condition in `getIsEqual` is correct
   - The condition should be: `options.keyField && !options.matchesArg && !options.isDeepEqual && !options.isShallowEqual`

3. **Test the fix**
   - Run the failing tests
   - Verify all tests pass
   - If this doesn't work, investigate further why `isMatchingKey` isn't working

## Files to Modify

- `src/options.ts` - Remove custom `isMatchingKey` and rely on default behavior with `deepEqual` for `isEqual`

## Detailed Implementation

### Change 1: Simplify `getIsMatchingKey` to not provide custom function

**Current code (lines 64-96):**
```typescript
export function getIsMatchingKey<MoizeableFn extends Moizeable>(
    options: Options<MoizeableFn>
): IsMatchingKey | undefined {
    const keyFieldMatchingKey =
        options.keyField &&
        !options.matchesKey &&
        !options.isSerialized
            ? function (cacheKey: Key, key: Key) {
                  // Compare entire key arrays using deepEqual for nested structures
                  if (!Array.isArray(cacheKey) || !Array.isArray(key)) {
                      return false;
                  }
                  if (cacheKey.length !== key.length) {
                      return false;
                  }
                  return deepEqual(cacheKey, key);
              }
            : undefined;

    return (
        options.matchesKey ||
        (options.isSerialized && getIsSerializedKeyEqual) ||
        keyFieldMatchingKey ||
        undefined
    );
}
```

**New code:**
```typescript
export function getIsMatchingKey<MoizeableFn extends Moizeable>(
    options: Options<MoizeableFn>
): IsMatchingKey | undefined {
    // When keyField is used, we rely on the default isMatchingKey behavior
    // which uses isEqual for each argument. Since we set isEqual to deepEqual
    // when keyField is used, the default will correctly handle nested arrays.
    // We only provide a custom isMatchingKey if there's an explicit override.
    return (
        options.matchesKey ||
        (options.isSerialized && getIsSerializedKeyEqual) ||
        undefined
    );
}
```

**Rationale:**
- The default `isMatchingKey` (created in `createFindKeyIndex`) uses `isEqual` for each argument
- Since `isEqual` is set to `deepEqual` when `keyField` is used, it will correctly compare nested arrays
- This avoids potential issues with micro-memoize not using the custom `isMatchingKey` correctly

### Change 2: Verify `getIsEqual` is correct (no changes needed)

The current implementation already sets `isEqual` to `deepEqual` when `keyField` is used:
```typescript
(options.keyField && !options.matchesArg && !options.isDeepEqual && !options.isShallowEqual && deepEqual) ||
```

This is correct and should remain as is.

## Testing

After making the change:
1. Run: `npm test -- __tests__/keyField.ts`
2. Verify both failing tests now pass
3. Verify all other tests still pass (16/18 should pass, 2 should now pass)
4. Final result should be: 18/18 tests passing

