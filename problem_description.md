# Identity-Based Array Element Memoization

## Problem Brief

Functions that process arrays where element identity matters more than position cannot benefit from memoization.

## Agent Instructions

1. When a `keyField` option is provided, cache keys must be based on element identity
2. The `keyField` option must accept either a string or a function
3. Cache matching must be order-independent - arrays with the same elements in any order should hit the same cache entry
4. When `maxSize` is specified, use LRU (Least Recently Used) eviction strategy
