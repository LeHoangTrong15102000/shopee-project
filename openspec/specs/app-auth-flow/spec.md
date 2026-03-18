## ADDED Requirements

### Requirement: Sign-In screen with email and password form
The system SHALL display a Sign-In screen at `/(auth)/sign-in` with email and password fields, a submit button, and navigation to Sign-Up.

#### Scenario: Render sign-in form
- **WHEN** user navigates to the sign-in screen
- **THEN** system displays a gradient background using `expo-linear-gradient`
- **AND** displays email input field with keyboard type "email-address"
- **AND** displays password input field with secure text entry
- **AND** displays "Đăng nhập" submit button using `AppButton` with variant "primary"
- **AND** displays "Đăng ký" navigation link to sign-up screen
- **AND** displays Google Sign-In button with outline variant

#### Scenario: Staggered entry animations
- **WHEN** sign-in screen mounts
- **THEN** system animates form elements with Reanimated `FadeInDown` entering animations
- **AND** each element has an incremental stagger delay (e.g., 100ms, 200ms, 300ms)

#### Scenario: Successful sign-in
- **WHEN** user submits valid email and password
- **THEN** system calls `authApi.login({ email, password })`
- **AND** stores access_token and refresh_token in auth store (persisted via MMKV)
- **AND** stores user profile in auth store
- **AND** sets `isAuthenticated` to true
- **AND** navigates user to the main `/(tabs)` screen

#### Scenario: Sign-in API error
- **WHEN** login API returns an error (e.g., 422 invalid credentials)
- **THEN** system displays error toast with the API error message
- **AND** does not navigate away from sign-in screen
- **AND** does not store any tokens

#### Scenario: Sign-in form validation failure
- **WHEN** user submits form with invalid email format
- **THEN** system displays validation error under email field via `FormMessage`
- **AND** does not call the login API

#### Scenario: Sign-in form validation - empty fields
- **WHEN** user submits form with empty email or password
- **THEN** system displays "Email là bắt buộc" or "Password là bắt buộc" error
- **AND** does not call the login API

#### Scenario: Sign-in form validation - password length
- **WHEN** user submits form with password shorter than 6 characters
- **THEN** system displays "Độ dài từ 6 - 160 ký tự" error under password field

#### Scenario: Loading state during sign-in
- **WHEN** login API call is in progress
- **THEN** system displays `AppButton` in loading state (spinner, disabled)
- **AND** disables all form inputs

### Requirement: Sign-Up screen with email, password, and confirm password form
The system SHALL display a Sign-Up screen at `/(auth)/sign-up` with email, password, confirm password fields, password strength indicator, and navigation to Sign-In.

#### Scenario: Render sign-up form
- **WHEN** user navigates to the sign-up screen
- **THEN** system displays a gradient background using `expo-linear-gradient`
- **AND** displays email input field
- **AND** displays password input field with secure text entry
- **AND** displays confirm password input field with secure text entry
- **AND** displays password strength indicator below password field
- **AND** displays "Đăng ký" submit button using `AppButton` with variant "primary"
- **AND** displays "Đăng nhập" navigation link to sign-in screen

#### Scenario: Successful sign-up
- **WHEN** user submits valid email, password, and matching confirm password
- **THEN** system calls `authApi.register({ email, password })`
- **AND** stores access_token and refresh_token in auth store
- **AND** stores user profile in auth store
- **AND** sets `isAuthenticated` to true
- **AND** navigates user to the main `/(tabs)` screen

#### Scenario: Sign-up API error - email already exists
- **WHEN** register API returns 422 with "Email đã tồn tại"
- **THEN** system displays error toast with the message
- **AND** does not navigate away

#### Scenario: Sign-up form validation - password mismatch
- **WHEN** user submits form with password !== confirm_password
- **THEN** system displays "Nhập lại password không khớp" error under confirm password field

#### Scenario: Password strength indicator
- **WHEN** user types in the password field
- **THEN** system displays strength indicator showing weak/medium/strong
- **AND** updates in real-time as user types

### Requirement: Auth Zustand store with MMKV persistence
The system SHALL create a dedicated `authStore.ts` Zustand store persisted via MMKV to manage authentication state.

#### Scenario: Store initial state
- **WHEN** app launches with no persisted auth data
- **THEN** auth store has `isAuthenticated: false`, `accessToken: null`, `refreshToken: null`, `user: null`

#### Scenario: Store login action
- **WHEN** `login` action is called with tokens and user profile
- **THEN** store sets `accessToken`, `refreshToken`, `user`, and `isAuthenticated: true`
- **AND** state is persisted to MMKV under key "auth-storage"

#### Scenario: Store logout action
- **WHEN** `logout` action is called
- **THEN** store clears `accessToken`, `refreshToken`, `user`
- **AND** sets `isAuthenticated` to false
- **AND** persisted MMKV data is cleared

#### Scenario: Rehydration on app restart
- **WHEN** app restarts and MMKV has persisted auth data
- **THEN** store rehydrates `accessToken`, `refreshToken`, `user` (via `partialize`)
- **AND** derives `isAuthenticated` from `!!accessToken` (via `onRehydrateStorage`)
- **AND** app can determine auth state before rendering

### Requirement: HTTP client with token interceptors
The system SHALL create an axios-based HTTP client at `utils/http.ts` that attaches tokens to requests and handles 401 refresh automatically.

#### Scenario: Attach access token to requests
- **WHEN** HTTP client sends a request and auth store has an access token
- **THEN** client sets `Authorization` header to the access token value

#### Scenario: Auto-refresh on 401 response
- **WHEN** API returns 401 Unauthorized with expired token error
- **THEN** client calls `POST /refresh-access-token` with the refresh token
- **AND** updates auth store with new access token
- **AND** retries the original failed request with the new token

#### Scenario: Refresh token failure
- **WHEN** refresh token request fails (e.g., refresh token expired)
- **THEN** client calls auth store `logout` action
- **AND** navigates user to sign-in screen

#### Scenario: Concurrent 401 requests
- **WHEN** multiple requests receive 401 simultaneously
- **THEN** client sends only ONE refresh token request
- **AND** queues other failed requests until refresh completes
- **AND** retries all queued requests with the new token

#### Scenario: Mock fallback when API unavailable
- **WHEN** the API at `api-ecom.duthanhduoc.com` is unreachable (network error, no response)
- **THEN** auth API service falls back to mock responses (same pattern as shopee-web `auth.api.ts`)
- **AND** returns mock tokens and user profile
- **AND** re-throws non-network errors (e.g., 422, 500) without fallback

### Requirement: Auth API service module
The system SHALL create `apis/auth.api.ts` calling the same endpoints as shopee-web for login, register, logout, and refresh token.

#### Scenario: Login API call
- **WHEN** `authApi.login({ email, password })` is called
- **THEN** system sends `POST /login` with `{ email, password }` body
- **AND** returns `AuthResponse` with `access_token`, `refresh_token`, `expires`, `user`

#### Scenario: Register API call
- **WHEN** `authApi.register({ email, password })` is called
- **THEN** system sends `POST /register` with `{ email, password }` body
- **AND** returns `AuthResponse` with `access_token`, `refresh_token`, `expires`, `user`

#### Scenario: Logout API call
- **WHEN** `authApi.logout()` is called
- **THEN** system sends `POST /logout`
- **AND** clears auth store state

#### Scenario: Refresh token API call
- **WHEN** `authApi.refreshToken()` is called
- **THEN** system sends `POST /refresh-access-token`
- **AND** returns `RefreshTokenResponse` with new `access_token`

### Requirement: Zod validation schemas for auth forms
The system SHALL create `schemas/auth.schema.ts` with Zod schemas for sign-in and sign-up form validation, compatible with the existing `useForm` hook.

#### Scenario: Sign-in schema validation
- **WHEN** sign-in form data is validated against `signInSchema`
- **THEN** schema requires `email` as valid email format
- **AND** requires `password` with length between 6 and 160 characters

#### Scenario: Sign-up schema validation
- **WHEN** sign-up form data is validated against `signUpSchema`
- **THEN** schema requires `email` as valid email format
- **AND** requires `password` with length between 6 and 160 characters
- **AND** requires `confirm_password` matching `password`

#### Scenario: Schema integration with useForm
- **WHEN** `useForm` is called with `validationSchema: signInSchema`
- **THEN** form validates on submit using the Zod schema
- **AND** returns field-level errors compatible with `FormMessage` component

### Requirement: Route protection with (auth) group
The system SHALL add an `(auth)` route group in Expo Router and redirect unauthenticated users to sign-in.

#### Scenario: Unauthenticated user accesses protected route
- **WHEN** user is not authenticated (`isAuthenticated === false`)
- **AND** user navigates to a protected route (e.g., `/(tabs)/home`)
- **THEN** system redirects user to `/(auth)/sign-in`

#### Scenario: Authenticated user accesses auth screens
- **WHEN** user is authenticated (`isAuthenticated === true`)
- **AND** user navigates to `/(auth)/sign-in` or `/(auth)/sign-up`
- **THEN** system redirects user to `/(tabs)/home`

#### Scenario: Auth state check in root layout
- **WHEN** root `_layout.tsx` renders
- **THEN** system reads `isAuthenticated` from auth store
- **AND** conditionally renders auth or main route groups

#### Scenario: Logout redirects to sign-in
- **WHEN** user triggers logout action
- **THEN** system clears auth store
- **AND** navigates to `/(auth)/sign-in`

### Requirement: Google Sign-In UI placeholder
The system SHALL display a Google Sign-In button on the sign-in screen that shows a "Coming soon" toast when tapped.

#### Scenario: Google button renders
- **WHEN** sign-in screen renders
- **THEN** system displays a Google Sign-In button with outline variant
- **AND** button shows Google icon and "Đăng nhập với Google" text

#### Scenario: Google button tap
- **WHEN** user taps the Google Sign-In button
- **THEN** system displays toast "Tính năng sắp ra mắt"
- **AND** does not attempt any OAuth flow

### Requirement: i18n keys for auth strings
The system SHALL add all auth-related strings to `config/locales/en.json` i18n translation file.

#### Scenario: Auth screen labels
- **WHEN** auth screens render
- **THEN** system loads text from i18n keys including: sign-in title, sign-up title, email label, password label, confirm password label, submit button text, navigation links

#### Scenario: Auth error messages
- **WHEN** validation or API errors occur
- **THEN** system displays error messages from i18n keys

### Requirement: KeyboardAvoidingView for auth forms
The system SHALL wrap auth forms in `KeyboardAvoidingView` to prevent the keyboard from covering input fields.

#### Scenario: Keyboard opens on input focus
- **WHEN** user taps an input field on the auth screen
- **THEN** system adjusts the view so the focused input remains visible above the keyboard
- **AND** uses platform-appropriate behavior ("padding" on iOS, "height" on Android)

#### Scenario: Scroll to focused field
- **WHEN** keyboard opens and the focused field is below the fold
- **THEN** system scrolls the form content to keep the focused field visible

