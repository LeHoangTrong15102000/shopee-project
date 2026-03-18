## Context

The `shopee-app` is an Expo SDK 54 / React Native 0.81 app using:
- **Routing**: Expo Router v6 (file-based, currently `app/(tabs)/` group only)
- **Styling**: NativeWind v4 + Tailwind CSS + CVA variants
- **State**: Zustand v5 + MMKV persistence (existing `appStore.ts` pattern)
- **Forms**: Custom `useForm` hook with Zod validation (already in `hooks/useForm.ts`)
- **UI**: Existing component library (`AppButton`, `AppInput`, `Form*`, `AppText`, `Toast`)
- **Animations**: React Native Reanimated v4 (already used in `AppInput`, `AppButton`, `Toast`)
- **i18n**: i18next with `config/locales/en.json`
- **Queries**: TanStack React Query v5 (configured in `config/queryClient.ts`)

The `shopee-web` frontend has a working auth flow against `https://api-ecom.duthanhduoc.com/` with endpoints: `POST /login`, `POST /register`, `POST /logout`, `POST /refresh-access-token`. The mobile app needs to use the same API with the same request/response contracts.

The `cellera-patient-portal-develop` project serves as a reference for mobile auth patterns: `KeyboardAvoidingView`, form layout, password strength indicators, and Google Sign-In UI.

## Goals / Non-Goals

**Goals:**
- Provide Sign-In and Sign-Up screens with polished UI (gradients, animations, staggered entry)
- Persist auth tokens securely via MMKV and manage auth state with Zustand
- Create a reusable HTTP client with automatic token attachment and refresh
- Protect authenticated routes — redirect unauthenticated users to sign-in
- Google Sign-In button visible in UI (placeholder, shows "Coming soon" toast)

**Non-Goals:**
- Actual Google Sign-In integration (backend not ready)
- Forgot password / reset password flow
- Email verification flow
- Biometric authentication
- Social login providers beyond Google UI placeholder

## Decisions

### 1. Auth Store: Separate Zustand store (`authStore.ts`)
**Choice**: Create a dedicated `store/authStore.ts` rather than extending `appStore.ts`.
**Rationale**: Auth state (tokens, user profile, isAuthenticated) has different lifecycle and persistence needs than app settings (theme, language). Separation keeps stores focused and avoids coupling. Same MMKV + `zustand/middleware/persist` pattern as `appStore.ts`.
**Alternative**: Extend `appStore.ts` — rejected because it would bloat the store and mix concerns.

### 2. HTTP Client: Axios class adapted from shopee-web
**Choice**: Create `utils/http.ts` as a class-based axios wrapper mirroring shopee-web's `Http` class, but using MMKV for token storage instead of localStorage.
**Rationale**: Proven pattern already working in shopee-web. Interceptors handle token attachment on requests and auto-refresh on 401 responses. Keeps API layer consistent across web and mobile.
**Alternative**: Use `fetch` directly — rejected because interceptor pattern is cleaner for token management.

### 3. Route Protection: Expo Router `(auth)` group + root layout redirect
**Choice**: Add `app/(auth)/_layout.tsx` route group. Root `_layout.tsx` checks `isAuthenticated` from auth store and redirects to `/(auth)/sign-in` if not authenticated.
**Rationale**: Expo Router's group-based routing is the idiomatic approach. Clean separation between auth screens and main app screens.
**Alternative**: Navigation guard middleware — Expo Router doesn't have built-in middleware, so layout-level redirect is the standard pattern.

### 4. Gradient Background: `expo-linear-gradient`
**Choice**: Use `expo-linear-gradient` for auth screen backgrounds.
**Rationale**: First-party Expo package, well-maintained, works with NativeWind. Provides the "colorful" feel requested.
**Alternative**: `react-native-linear-gradient` — works but `expo-linear-gradient` is the Expo-native choice.

### 5. Animations: Reanimated entering/layout animations
**Choice**: Use Reanimated's `FadeInDown`, `FadeInUp` entering animations with staggered delays for form elements. Button press uses existing `withSpring` scale pattern from `AppButton`.
**Rationale**: Reanimated v4 is already installed and used throughout the app. Entering animations are declarative and performant.

### 6. Form Validation: Zod schemas + existing `useForm` hook
**Choice**: Create `schemas/auth.schema.ts` with Zod schemas, use with existing `useForm` hook and `FormField` components.
**Rationale**: The app already has a custom `useForm` hook that accepts `validationSchema` (Zod). No need for react-hook-form — the existing hook is sufficient and already integrated with `FormField`/`FormMessage` components.

### 7. Token Storage: MMKV (not Keychain/SecureStore)
**Choice**: Store tokens in MMKV via Zustand persist, same as other app state.
**Rationale**: MMKV is already the persistence layer. For this e-commerce demo app, MMKV provides adequate security. Production apps should consider `expo-secure-store` or Keychain, but that's out of scope for this change.
**Alternative**: `expo-secure-store` — better security but adds complexity and a new dependency for a demo app.

## Risks / Trade-offs

- **[Token in MMKV]** → Tokens stored in MMKV are not encrypted at rest. Acceptable for demo; document as known limitation. Migration to SecureStore can be done later.
- **[Google Sign-In UI-only]** → Users may tap the button expecting it to work. Mitigated by showing a clear "Coming soon" toast and visually distinguishing it (outline style, not primary).
- **[API availability]** → The external API `api-ecom.duthanhduoc.com` may be down. Mitigated by adding mock fallbacks in the auth API service (same pattern as shopee-web).
- **[No refresh token rotation]** → The API returns a new access_token on refresh but doesn't rotate the refresh_token. If the refresh token is compromised, it remains valid until expiry. Acceptable for demo scope.

