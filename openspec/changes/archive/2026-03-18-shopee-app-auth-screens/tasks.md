## 1. Types and Schemas

- [x] 1.1 Create `types/utils.type.ts` with `SuccessResponseApi`, `ErrorResponseApi` (mirror shopee-web types)
- [x] 1.2 Create `types/user.type.ts` with `User` interface and `Role` type (mirror shopee-web types)
- [x] 1.3 Create `types/auth.type.ts` with `AuthResponse` and `RefreshTokenResponse` types
- [x] 1.4 Create `schemas/auth.schema.ts` with `signInSchema` (email + password) and `signUpSchema` (email + password + confirm_password with refine) using Zod ← (verify: schemas integrate with existing `useForm` hook's `validationSchema` prop)

## 2. Auth Store

- [x] 2.1 Create `store/authStore.ts` — Zustand store with MMKV persistence, state: `accessToken`, `refreshToken`, `user`, `isAuthenticated`; actions: `login`, `logout`, `setAccessToken`; persist config using same `mmkvStorage` adapter pattern from `appStore.ts` ← (verify: store rehydrates correctly on app restart, logout clears all persisted data)

## 3. HTTP Client and Auth API

- [x] 3.1 Create `utils/http.ts` — class-based axios wrapper adapted from shopee-web's `Http` class; request interceptor attaches access_token from auth store; response interceptor handles 401 with refresh token flow; single refresh request for concurrent 401s; uses MMKV via auth store instead of localStorage
- [x] 3.2 Create `apis/auth.api.ts` — `login`, `register`, `logout`, `refreshToken` functions calling same endpoints as shopee-web (`POST /login`, `POST /register`, `POST /logout`, `POST /refresh-access-token`); include mock fallback pattern for when API is unavailable ← (verify: API contracts match shopee-web `auth.api.ts`, mock fallback returns valid `AuthResponse` shape)

## 4. i18n Keys

- [x] 4.1 Add auth i18n keys to `config/locales/en.json` — sign-in title, sign-up title, email/password/confirm-password labels, submit button text, navigation links, error messages, Google sign-in text, "Coming soon" toast message

## 5. Route Structure

- [x] 5.1 Create `app/(auth)/_layout.tsx` — layout for auth route group; redirect authenticated users to `/(tabs)/home`
- [x] 5.2 Update `app/_layout.tsx` — read `isAuthenticated` from auth store; redirect unauthenticated users to `/(auth)/sign-in`; handle store rehydration before rendering ← (verify: unauthenticated → sign-in redirect, authenticated → tabs redirect, no flash of wrong screen during rehydration)

## 6. Sign-In Screen

- [x] 6.1 Create `app/(auth)/sign-in.tsx` — gradient background with `expo-linear-gradient`; `KeyboardAvoidingView` with platform-appropriate behavior; `ScrollView` for form content
- [x] 6.2 Wire sign-in form — use `useForm` with `signInSchema`; email `AppInput` (keyboardType email-address), password `AppInput` (secureTextEntry); `FormField`/`FormMessage` for validation errors; `AppButton` primary for submit with loading state
- [x] 6.3 Add sign-in submit handler — call `authApi.login`, on success store tokens/user via `authStore.login`, navigate to `/(tabs)`; on error show error toast; disable inputs during loading
- [x] 6.4 Add staggered Reanimated entering animations — `FadeInDown` with incremental delay on each form element (logo, title, email, password, button, links)
- [x] 6.5 Add Google Sign-In placeholder button — `AppButton` outline variant with Google icon, "Đăng nhập với Google" text; on press show toast "Tính năng sắp ra mắt"
- [x] 6.6 Add navigation link to sign-up — "Bạn chưa có tài khoản? Đăng ký" text linking to `/(auth)/sign-up` ← (verify: full sign-in flow works — validation errors display, successful login navigates to tabs, API errors show toast, loading state disables form)

## 7. Sign-Up Screen

- [x] 7.1 Create `app/(auth)/sign-up.tsx` — gradient background, `KeyboardAvoidingView`, `ScrollView`, same layout pattern as sign-in
- [x] 7.2 Wire sign-up form — use `useForm` with `signUpSchema`; email, password, confirm_password `AppInput` fields; `FormField`/`FormMessage` for validation; password strength indicator component
- [x] 7.3 Add password strength indicator — visual bar/text showing weak/medium/strong based on password content; updates in real-time on password change
- [x] 7.4 Add sign-up submit handler — call `authApi.register`, on success store tokens/user via `authStore.login`, navigate to `/(tabs)`; on error (422 email exists) show error toast
- [x] 7.5 Add staggered Reanimated entering animations — same `FadeInDown` pattern as sign-in
- [x] 7.6 Add navigation link to sign-in — "Đã có tài khoản? Đăng nhập" text linking to `/(auth)/sign-in` ← (verify: full sign-up flow works — validation catches password mismatch, strength indicator updates, successful register navigates to tabs, duplicate email shows toast)

## 8. Install Dependencies

- [x] 8.1 Install `expo-linear-gradient`, `axios`, `zod` in `apps/shopee-app` (zod may already exist — check first) ← (verify: all dependencies resolve, no version conflicts with existing packages)

