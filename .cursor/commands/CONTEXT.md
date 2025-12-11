# Project Context

> **IMPORTANT**: Update this file after EVERY change. Keep entries brief (1-2 lines per change).

## Recent Changes Log

### 2024-12-19 - Problem Description Creation

**What Changed**:
- Created problem_description.md file for identity-based array element memoization feature

**Files Modified**:
- problem_description.md (new file)

**Why**:
- Initial problem setup for hard-level feature request (5+ hours for senior developer)

### 2024-12-19 - Problem Description Refinement

**What Changed**:
- Refined problem_description.md to be concise, behavioral, and avoid implementation details
- Removed storytelling from Problem Brief
- Rewrote Agent Instructions to focus on WHAT (behavioral requirements) rather than HOW (implementation)
- Minimized Test Assumptions to only non-obvious naming/structure requirements

**Files Modified**:
- problem_description.md

**Why**:
- Align with criteria: concise, minimal test assumptions, behavioral focus, no implementation prescription

### 2024-12-19 - Test Patch Creation

**What Changed**:
- Created comprehensive test file `__tests__/keyField.ts` covering all keyField feature requirements
- Created `test.sh` script with base/new modes for test execution
- Generated `test.patch` file for feature request submission

**Files Modified**:
- __tests__/keyField.ts (new file)
- test.sh (new file)
- test.patch (new file)

**Why**:
- Create test patch according to guidelines: comprehensive tests, test.sh with base/new modes, offline-capable

### 2024-12-19 - Test Patch Corrections

**What Changed**:
- Removed ambiguous requirement #3 about overlapping elements sharing cache from problem_description.md
- Replaced misleading "overlapping elements" test with clearer test for different element sets
- Enhanced maxSize test to explicitly demonstrate LRU eviction behavior with step-by-step verification
- Regenerated test.patch with corrected files

**Files Modified**:
- problem_description.md
- __tests__/keyField.ts
- test.patch

**Why**:
- Address feedback: remove infeasible/ambiguous requirement, fix test that didn't validate stated behavior, clarify LRU eviction assumption

### 2024-12-19 - Remove Redundant Requirement

**What Changed**:
- Removed redundant bullet 2 from Agent Instructions about order-independence (implied by bullet 1)
- Renumbered remaining bullets
- Regenerated test.patch

**Files Modified**:
- problem_description.md
- test.patch

**Why**:
- Remove redundancy: order-independence is implied by identity-based keys requirement

### 2024-12-19 - Simplify Problem Brief

**What Changed**:
- Removed first sentence describing current behavior from Problem Brief
- Kept only the motivation sentence about functions that process arrays
- Regenerated test.patch

**Files Modified**:
- problem_description.md
- test.patch

**Why**:
- Remove unnecessary existing behavior description, keep only motivation

### 2024-12-19 - Remove Documentation from Test Patch

**What Changed**:
- Removed problem_description.md from test.patch (documentation not needed for test execution)
- Patch now contains only test files: __tests__/keyField.ts and test.sh
- Regenerated test.patch

**Files Modified**:
- test.patch

**Why**:
- Address warnings: test patch should only include files required for running tests, not documentation

### 2024-12-19 - Simplify Problem Description Language

**What Changed**:
- Removed "or reference" from bullet 1 (redundant with element-identity-based keys)
- Removed "to identify array elements" from bullet 2 (implied by context)
- Removed parenthetical examples from bullet 3 (trimmed to "existing moize options")
- Removed redundant call form from Test Assumptions (removed "alongside moize(fn, { keyField: ... })")

**Files Modified**:
- problem_description.md

**Why**:
- Make problem description more concise by removing redundant phrases and implied information

### 2024-12-19 - Create Dockerfile for Development Environment

**What Changed**:
- Created Dockerfile using mars-base image for development environment
- Enabled Corepack to support Yarn 4.10.2 (required by package.json)
- Installed dependencies with yarn install
- Tested Docker build and offline execution successfully

**Files Modified**:
- Dockerfile (new file)

**Why**:
- Create development environment where AI agent can jump in, write code, and debug
- Follow guidelines: use mars-base image, install dependencies, end with interactive shell
- Removed test.sh handling (applied at runtime, not during build)

### 2024-12-19 - Add Test for Non-Key Field Ignoring

**What Changed**:
- Added test "should ignore non-key fields and cache-hit when keyField values match" for string keyField
- Added test "should ignore non-key fields when using function keyField" for function keyField
- Both tests verify that objects with same keyField values but different non-key properties hit the same cache
- Regenerated test.patch

**Files Modified**:
- __tests__/keyField.ts
- test.patch

**Why**:
- Address warning: verify important nuance that non-key fields are ignored in identity-based memoization

### 2024-12-19 - Clarify Options Syntax and Integration in Test Assumptions

**What Changed**:
- Added to Test Assumptions: options-object syntax `moize(fn, { keyField: ... })` is available
- Added to Test Assumptions: keyField works with existing moize options (isDeepEqual, isShallowEqual, transformArgs, maxSize)

**Files Modified**:
- problem_description.md

**Why**:
- Address warning: clarify interfaces/expectations for options-object usage and integration with other options that tests assume

