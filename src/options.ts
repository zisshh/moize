import { deepEqual, sameValueZeroEqual, shallowEqual } from 'fast-equals';
import { createGetInitialArgs } from './maxArgs';
import {
    defaultArgumentSerializer,
    getIsSerializedKeyEqual,
    getSerializerFunction,
} from './serialize';
import { compose } from './utils';

import type {
    Cache,
    IsEqual,
    IsMatchingKey,
    Key,
    KeyField,
    MicroMemoizeOptions,
    Moizeable,
    Moized,
    OnCacheOperation,
    Options,
    TransformKey,
} from '../index.d';

export type KeyFieldPipelineState = {
    lastAccessMap: Map<string, number>;
    pending?: {
        hash: string;
        previousAccess?: number;
    };
};

export function createOnCacheOperation<MoizeableFn extends Moizeable>(
    fn?: OnCacheOperation<MoizeableFn>
): OnCacheOperation<MoizeableFn> {
    if (typeof fn === 'function') {
        return (
            _cacheIgnored: Cache<MoizeableFn>,
            _microMemoizeOptionsIgnored: MicroMemoizeOptions<MoizeableFn>,
            memoized: Moized
        ): void => fn(memoized.cache, memoized.options, memoized);
    }
}

/**
 * @private
 *
 * @description
 * get the isEqual method passed to micro-memoize
 *
 * @param options the options passed to the moizer
 * @returns the isEqual method to apply
 */
export function getIsEqual<MoizeableFn extends Moizeable>(
    options: Options<MoizeableFn>
): IsEqual {
    return (
        options.matchesArg ||
        (options.isDeepEqual && deepEqual) ||
        (options.isShallowEqual && shallowEqual) ||
        // Use deepEqual when keyField is used (and no explicit equality method)
        // to handle nested array keys created by the transform
        (options.keyField && !options.matchesArg && !options.isDeepEqual && !options.isShallowEqual && deepEqual) ||
        sameValueZeroEqual
    );
}

/**
 * @private
 *
 * @description
 * get the isEqual method passed to micro-memoize
 *
 * @param options the options passed to the moizer
 * @returns the isEqual method to apply
 */
export function getIsMatchingKey<MoizeableFn extends Moizeable>(
    options: Options<MoizeableFn>
): IsMatchingKey | undefined {
    // When keyField is used, we need to provide an isMatchingKey that uses deepEqual
    // to compare the entire key arrays. This ensures nested arrays created by the
    // transform are correctly matched.
    const isDebugEnabled = process.env.MOIZE_DEBUG_KEYFIELD === 'true';

    const keyFieldMatchingKey =
        options.keyField &&
        !options.matchesKey &&
        !options.isSerialized
            ? function (cacheKey: Key, key: Key) {
                  if (isDebugEnabled) {
                      // eslint-disable-next-line no-console
                      console.log('[moize:keyField] isMatchingKey compare', {
                          cacheKey,
                          key,
                      });
                  }
                  // Compare entire key arrays using deepEqual for nested structures
                  // This is necessary because the transform creates nested arrays like [['a', 'b']]
                  // and we need to ensure they're compared correctly
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

/**
 * @private
 *
 * @description
 * create a transform function that extracts keys from array elements using keyField
 *
 * @param keyField the keyField option (string or function)
 * @returns the transform function
 */
export function createKeyFieldTransform(
    keyField: KeyField
): TransformKey | undefined {
    const isDebugEnabled = process.env.MOIZE_DEBUG_KEYFIELD === 'true';

    return function (key: Key): Key {
        if (!Array.isArray(key) || key.length === 0) {
            return key;
        }

        const firstArg = key[0];

        if (!Array.isArray(firstArg)) {
            return key;
        }

        const extractKey =
            typeof keyField === 'string'
                ? (item: any) => item?.[keyField]
                : keyField;

        const extractedKeys = firstArg.map(extractKey);

        // Sort keys to make order-independent
        // Use a stable sort that handles different types consistently
        const sortedKeys = extractedKeys.slice().sort((a, b) => {
            // Handle null/undefined
            if (a == null && b == null) return 0;
            if (a == null) return -1;
            if (b == null) return 1;

            // Handle same type comparisons
            if (typeof a === typeof b) {
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            }

            // Different types: convert to string for comparison
            const aStr = String(a);
            const bStr = String(b);
            if (aStr < bStr) return -1;
            if (aStr > bStr) return 1;
            return 0;
        });

        if (isDebugEnabled) {
            // eslint-disable-next-line no-console
            console.log('[moize:keyField] transform', {
                originalArgs: key,
                extractedKeys,
                sortedKeys,
            });
        }

        return [sortedKeys, ...key.slice(1)];
    };
}

/**
 * @private
 *
 * @description
 * get the function that will transform the key based on the arguments passed
 *
 * @param options the options passed to the moizer
 * @returns the function to transform the key with
 */
export function getTransformKey<MoizeableFn extends Moizeable>(
    options: Options<MoizeableFn>,
    keyFieldState?: KeyFieldPipelineState
): TransformKey | undefined {
    const baseTransform = compose(
        options.isSerialized && getSerializerFunction(options),
        typeof options.transformArgs === 'function' && options.transformArgs,
        options.keyField && createKeyFieldTransform(options.keyField),
        typeof options.maxArgs === 'number' &&
            createGetInitialArgs(options.maxArgs)
    ) as TransformKey | undefined;

    if (keyFieldState && baseTransform) {
        return function (key: Key) {
            const transformedKey = baseTransform(key);
            const hash = defaultArgumentSerializer(
                transformedKey
            )[0] as string;

            keyFieldState.pending = {
                hash,
                previousAccess: keyFieldState.lastAccessMap.get(hash),
            };

            return transformedKey;
        };
    }

    return baseTransform;
}
