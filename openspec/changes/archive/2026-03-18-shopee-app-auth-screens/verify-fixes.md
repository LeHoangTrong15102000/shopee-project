## [2026-03-17] Round 1 (from spx-apply auto-verify)

### spx-verifier
- Fixed: Removed HTML comment placeholders from sign-in.tsx and sign-up.tsx that broke JSX compilation
- Fixed: Changed Zod schema from `z.email()` to `z.string().email()` for correct v4 API with custom error messages

### spx-arch-verifier
- Fixed: Removed duplicate auth state mutation from HTTP response interceptor (screens handle login/logout state)
- Fixed: Extracted shared `mmkvStorage` adapter from appStore.ts, authStore.ts now imports it (DRY)
- Fixed: Mock fallback in auth.api.ts now only catches network errors (no response), re-throws 422/500 errors
- Fixed: Cleaned up unused imports in http.ts (removed AuthResponse, URL_LOGIN, URL_REGISTER, URL_LOGOUT)

### spx-uiux-verifier
- Fixed: Added `accessibilityRole` and `accessibilityLabel` to sign-in/sign-up buttons and link buttons
- Fixed: Increased touch target on link buttons from `p-0 h-auto` to `min-h-[44px] px-2` (WCAG 2.5.5)
- Fixed: Added `accessibilityRole="progressbar"` and `accessibilityValue` to password strength indicator
- Fixed: Replaced hardcoded hex colors in password strength with `AppColors` design tokens

## [2026-03-18] Round 2 (from spx-apply auto-verify)

### spx-verifier
- Fixed: Renamed API functions to match shopee-web naming convention (`login` → `loginAccount`, `register` → `registerAccount`, `logout` → `logoutAccount`, `refreshToken` → `refreshAccessToken`) in auth.api.ts and updated call sites in sign-in.tsx and sign-up.tsx
- Skipped: Zod v4 vs v3 transitive dependency conflict — false positive, storybook/chromatic are shopee-web deps, not shopee-app

### spx-uiux-verifier
- Fixed: Replaced hardcoded gradient hex colors `['#1a1a2e', '#16213e', '#0f3460']` with `AppColors.gradientStart/Middle/End` tokens in sign-in.tsx and sign-up.tsx; added gradient tokens to both AppColors and AppColorsLight in config/colors.ts
- Fixed: Added reduced motion support — `AccessibilityInfo.isReduceMotionEnabled()` check in sign-in.tsx and sign-up.tsx, animations conditionally disabled when reduce motion is enabled
- Fixed: Added `accessibilityState={{ disabled: isDisabled }}` to AnimatedPressable in AppButton.tsx
- Fixed: Replaced hardcoded ActivityIndicator colors (`#e85a5a`, `#ffffff`) with `colors.error` and `colors.primaryForeground` in AppButton.tsx


## [2026-03-17] Round 3 (from spx-apply auto-verify)

### spx-uiux-verifier
- Fixed: Added `accessibilityRole="alert"` and `accessibilityLiveRegion="assertive"` to Toast Animated.View wrapper in Toast.tsx
- Fixed: Added `accessibilityRole="button"` and `accessibilityLabel="Dismiss notification"` to Toast close TouchableOpacity in Toast.tsx
- Fixed: Added `nativeID` to TextInput and `nativeID` to label Text with `accessibilityLabelledBy` linkage in AppInput.tsx for programmatic label association
- Fixed: Changed `variant="h1"` to `variant="display3"` in sign-in.tsx and sign-up.tsx (h1 is not a valid AppText variant)
- Fixed: Replaced hardcoded padding values (24, 20) with `AppSpacing.screenPaddingHorizontal/Vertical` tokens in sign-in.tsx and sign-up.tsx
- Fixed: Differentiated light theme gradient tokens in AppColorsLight — changed from dark navy to light indigo palette (#e8eaf6, #c5cae9, #9fa8da)

### spx-arch-verifier
- Fixed: Extracted `mmkvStorage` adapter and `storage` MMKV instance to dedicated `store/mmkvStorage.ts` module — appStore.ts and authStore.ts now import from neutral module (no peer store coupling)
- Fixed: Removed duplicate `URL_REFRESH_TOKEN` from http.ts — now imports from `@/apis/auth.api`
- Fixed: Moved Vietnamese auth strings from en.json to vi.json, replaced en.json auth keys with English translations
- Fixed: Externalized `API_BASE_URL` to `config/env.ts` using `process.env.EXPO_PUBLIC_API_BASE_URL` with fallback — http.ts now imports from config
- Fixed: Added `partialize` to authStore persist config to exclude `isAuthenticated` (derived from accessToken on rehydration via `onRehydrateStorage`)

### spx-verifier
- Fixed: Updated Zod schema syntax from bare string error messages to object-based `{ message: '...' }` format in auth.schema.ts (Zod v4 deprecation)
- Fixed: Removed fallback duplication in showError — sign-in.tsx and sign-up.tsx now pass `error?.response?.data?.message` directly (undefined when absent, not duplicating title)


## [2026-03-17] Round 4 (from spx-apply re-verify)

### spx-uiux-verifier
- Fixed: Added `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"` to AppInput error text in AppInput.tsx (inline form validation errors now announced to screen readers)
- Fixed: Added `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"` to FormMessage component in Form.tsx
- Fixed: Added blank screen during auth store rehydration in _layout.tsx — renders empty View with background color when `!isReady` to prevent flash of wrong screen
- Fixed: Added `items-center` to link row containers in sign-in.tsx and sign-up.tsx for proper vertical text alignment
- Fixed: Increased Toast close button padding from `p-1` to `p-2` for 48px effective touch target (WCAG 2.5.5)
- Fixed: Added `raw` prop to "Shopee" brand AppText in sign-in.tsx and sign-up.tsx to skip unnecessary i18n translation lookup


## [2026-03-18] Round 5 (from spx-apply auto-verify)

### spx-uiux-verifier
- Fixed: Wired passwordRef/confirmPasswordRef to sign-up.tsx inputs and added autoComplete, textContentType, returnKeyType, onSubmitEditing to all three sign-up form inputs (email→password→confirmPassword→submit keyboard chain)
- Fixed: Changed light-mode gradient tokens from light indigo (#e8eaf6, #c5cae9, #9fa8da) to dark indigo (#283593, #1a237e, #0d1b5e) in AppColorsLight — contrast ratios now 8.5:1+ for white text
- Fixed: Added reduced motion support to Toast.tsx — enter/dismiss/position animations now check AccessibilityInfo.isReduceMotionEnabled() and skip animations when enabled

### spx-arch-verifier
- Fixed: Extracted URL constants (URL_LOGIN, URL_REGISTER, URL_LOGOUT, URL_REFRESH_TOKEN) to apis/auth.constants.ts — broke circular dependency between http.ts → auth.api.ts → http.ts
- Fixed: Replaced hardcoded Vietnamese strings in auth.schema.ts with i18n keys using i18n.t() — added AUTH_VALIDATION_EMAIL_REQUIRED, AUTH_VALIDATION_EMAIL_INVALID, AUTH_VALIDATION_PASSWORD_LENGTH, AUTH_VALIDATION_PASSWORD_MISMATCH to en.json and vi.json
- Fixed: Extracted getPasswordStrength function from sign-up.tsx to utils/passwordStrength.ts utility module

### spx-verifier
- Fixed: Removed unused formState destructuring from useForm in sign-in.tsx and sign-up.tsx
