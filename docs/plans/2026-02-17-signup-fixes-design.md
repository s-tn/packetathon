# Signup Page Fixes & Cleanup Design

**Date**: 2026-02-17
**Status**: Approved

## Overview

Seven changes to the hackathon registration app: remove placeholder text, fix form navigation bugs, fix phone input issues, redirect home button, and fix password reset.

## Changes

### 1. Fix Form "Next" Button (Personal -> Team)

**Problem**: `switchToSection()` silences `window.alert` then calls `requestSubmit()` in a while loop. When the user clicks Next and validation fails (missing school/major/grade), the alert is swallowed and nothing visible happens.

**Fix**: Make the Next button directly submit the form (`document.querySelector('form')?.requestSubmit()`) instead of calling `switchToSection`. The form's `onSubmit` handler already advances the section and shows validation alerts. Reserve `switchToSection` only for tab header jumps.

**Files**: `src/App.jsx` (lines 1446-1448)

### 2. Phone Number Autofill Formatting

**Problem**: Formatting runs only in the `keydown` handler. Browser autofill doesn't trigger `keydown`, so `_value` is never set and formatting doesn't apply.

**Fix**: Add an `input`/`change` event listener to each phone field that detects value changes from autofill/paste, strips non-digits, sets `_value`, and applies formatting. Applies to all 3 phone inputs (main, parent1, parent2).

**Files**: `src/App.jsx` (lines ~281, ~554, ~722)

### 3. Phone Number Tab Key

**Problem**: `e.preventDefault()` at line 285 blocks ALL keys except arrow keys, including Tab.

**Fix**: Add Tab (and Shift for Shift+Tab) to the early-return allow-list. Applies to all 3 phone inputs.

**Files**: `src/App.jsx` (lines ~282, ~555, ~723)

### 4. Remove Header Lorem Text

**Problem**: CardDescription at line 1235-1237 contains lorem ipsum.

**Fix**: Remove the `<CardDescription>` element entirely.

**Files**: `src/App.jsx` (lines 1235-1237)

### 5. Remove Legal Section

**Problem**: Legal step has placeholder lorem text. User wants it removed entirely.

**Fix**:
- Remove sections[2] (Legal) from the sections array
- Update ToggleGroup: Personal, Team, Review, Account (4 tabs)
- Update progress bar values from [10, 30, 50, 70, 90] to [10, 35, 65, 90]
- Remove checkbox1/checkbox2 validation from the submit handler (lines 1399-1407)
- Update section index references (old section 3 Review -> new section 2, old section 4 Account -> new section 3)

**Files**: `src/App.jsx`

### 6. Home Button Redirect

**Problem**: Home button goes to `/` (Elm app). User wants it to go to bthackathon.com.

**Fix**: Change `location.href = '/'` to `location.href = 'https://bthackathon.com'` at line 1232.

**Files**: `src/App.jsx` (line 1232)

### 7. Password Reset Always Return 200

**Problem**: `/api/forgot-password` returns 404 when user not found, which exposes whether emails are registered.

**Fix**: Return 200 with success message regardless of whether the user exists. Only actually send the reset email when the user is found.

**Files**: `server/routes/auth.ts` (lines 261-264)
