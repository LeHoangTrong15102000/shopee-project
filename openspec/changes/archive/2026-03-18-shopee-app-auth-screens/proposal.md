## Why

The `shopee-app` (Expo/React Native) currently has no authentication flow. Users land directly on the home tab with no way to sign in or register. The `shopee-web` frontend already has a working auth flow against `api-ecom.duthanhduoc.com`, so the mobile app needs parity to become a usable client. This is a prerequisite for any user-specific features (cart, profile, orders).

## What Changes

- Add Sign-In screen with email/password form, gradient background, staggered entry animations, and a Google Sign-In button (UI-only placeholder)
- Add Sign-Up screen with email/password/confirm-password form, password strength indicators, gradient background, and animations
- Create an auth Zustand store (persisted via MMKV) to manage tokens, user profile, and authentication state
- Create an HTTP client (axios) with request/response interceptors for token attachment, auto-refresh on 401, and error handling — adapted from the shopee-web `Http` class for React Native
- Create auth API service module calling the same endpoints as shopee-web (`POST /login`, `POST /register`, `POST /logout`, `POST /refresh-access-token`)
- Add Zod validation schemas for sign-in and sign-up forms
- Add an `(auth)` route group in Expo Router with route protection (redirect unauthenticated users to sign-in)
- Update root layout to handle auth state and conditional navigation
- Add i18n keys for all auth-related strings

## Capabilities

### New Capabilities
- `app-auth-flow`: Sign-In and Sign-Up screens with form validation, animations, gradient UI, auth state management, HTTP client with token handling, and route protection for the shopee-app mobile client.

### Modified Capabilities
<!-- No existing specs are being modified — this is a net-new capability for shopee-app -->

## Impact

- **New files in `apps/shopee-app/`**:
  - `app/(auth)/_layout.tsx`, `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx`
  - `store/authStore.ts`
  - `utils/http.ts` (axios HTTP client for RN)
  - `apis/auth.api.ts`
  - `schemas/auth.schema.ts`
  - `types/auth.type.ts`, `types/user.type.ts`, `types/utils.type.ts`
- **Modified files**:
  - `app/_layout.tsx` — add auth state check, conditional routing
  - `app/index.tsx` — redirect based on auth state
  - `config/locales/en.json` — add auth i18n keys
- **Dependencies**: `expo-linear-gradient` (new), `axios` (new), `zod` (new — already used by `useForm` hook)
- **API**: Same backend as shopee-web — `https://api-ecom.duthanhduoc.com/`
- **No breaking changes** to existing screens or components

