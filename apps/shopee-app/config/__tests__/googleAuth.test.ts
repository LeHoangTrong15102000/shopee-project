import { isValidClientId } from '../googleAuth'

// Mock expo-constants before importing the module under test
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        googleAuth: {
          webClientId: '',
          androidClientId: '',
          iosClientId: '',
        },
      },
    },
  },
}))

// Mock react-native Platform — default to 'android' for most tests
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
}))

// isGoogleAuthConfigured is a module-level constant; we must re-require the
// module inside each test that changes Platform.OS to pick up updated values.

describe('isValidClientId', () => {
  it('returns false for empty string', () => {
    expect(isValidClientId('')).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isValidClientId(undefined)).toBe(false)
  })

  it('returns false for a YOUR_ placeholder', () => {
    expect(isValidClientId('YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com')).toBe(false)
  })

  it('returns false for a string that does not end with .apps.googleusercontent.com', () => {
    expect(isValidClientId('123-abc.example.com')).toBe(false)
  })

  it('returns true for a well-formed client ID', () => {
    expect(isValidClientId('123-abc.apps.googleusercontent.com')).toBe(true)
  })

  it('returns true for a realistic looking client ID', () => {
    expect(isValidClientId('1234567890-abcdefghijklmno.apps.googleusercontent.com')).toBe(true)
  })
})

describe('isGoogleAuthConfigured — empty config (default app.json state)', () => {
  it('is false when all client IDs are empty strings', () => {
    // The module was loaded with empty strings from the mock above.
    // On android Platform.OS, it requires webClientId AND androidClientId.
    const { isGoogleAuthConfigured } = require('../googleAuth')
    expect(isGoogleAuthConfigured).toBe(false)
  })
})

describe('isGoogleAuthConfigured — YOUR_ placeholder values', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.mock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: {
            googleAuth: {
              webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
              androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
              iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
            },
          },
        },
      },
    }))
    jest.mock('react-native', () => ({ Platform: { OS: 'android' } }))
  })

  it('is false when values are YOUR_ placeholders', () => {
    const { isGoogleAuthConfigured } = require('../googleAuth')
    expect(isGoogleAuthConfigured).toBe(false)
  })
})

describe('isGoogleAuthConfigured — valid values on android', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.mock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: {
            googleAuth: {
              webClientId: '111-web.apps.googleusercontent.com',
              androidClientId: '222-android.apps.googleusercontent.com',
              iosClientId: '',
            },
          },
        },
      },
    }))
    jest.mock('react-native', () => ({ Platform: { OS: 'android' } }))
  })

  it('is true when webClientId and androidClientId are valid', () => {
    const { isGoogleAuthConfigured } = require('../googleAuth')
    expect(isGoogleAuthConfigured).toBe(true)
  })
})

describe('isGoogleAuthConfigured — valid web only on web platform', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.mock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: {
            googleAuth: {
              webClientId: '111-web.apps.googleusercontent.com',
              androidClientId: '',
              iosClientId: '',
            },
          },
        },
      },
    }))
    jest.mock('react-native', () => ({ Platform: { OS: 'web' } }))
  })

  it('is true when only webClientId is valid and platform is web', () => {
    const { isGoogleAuthConfigured } = require('../googleAuth')
    expect(isGoogleAuthConfigured).toBe(true)
  })
})
