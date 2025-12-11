#!/bin/bash

# Test script for keyField feature
# Usage:
#   ./test.sh base  - Runs existing tests (regression tests)
#   ./test.sh new   - Runs only new keyField tests

set -e

MODE="${1:-base}"

if [ "$MODE" = "base" ]; then
    # Run all existing tests except the new keyField test
    npm test -- --testPathIgnorePatterns=keyField
elif [ "$MODE" = "new" ]; then
    # Run only the new keyField test
    npm test -- __tests__/keyField.ts
else
    echo "Usage: $0 [base|new]"
    echo "  base - Run existing tests (regression tests)"
    echo "  new  - Run only new keyField tests"
    exit 1
fi

