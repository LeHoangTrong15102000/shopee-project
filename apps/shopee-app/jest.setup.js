// Mock react-i18next with actual English translations so t() returns real strings
jest.mock('react-i18next', () => {
  const en = require('./config/locales/en.json')

  function resolve(obj, key) {
    // Support nested dot-notation keys like 'cart.empty.action'
    // and interpolation like '{{count}}'
    const parts = key.split('.')
    let current = obj
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return key
      current = current[part]
    }
    if (typeof current === 'string') return current
    return key
  }

  const t = (key, opts) => {
    let str = resolve(en, key)
    if (opts && typeof str === 'string') {
      Object.entries(opts).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
      })
    }
    return str
  }

  return {
    useTranslation: () => ({ t, i18n: { language: 'en', changeLanguage: jest.fn() } }),
    Trans: ({ children }) => children,
    initReactI18next: { type: '3rdParty', init: jest.fn() },
    I18nextProvider: ({ children }) => children,
  }
})

// Pre-define expo globals to prevent lazy require issues in expo/src/winter/runtime.native.ts
// Expo SDK 54 lazily polyfills these globals, but the lazy require can fail in jest
const expoGlobals = {
  __ExpoImportMetaRegistry: { url: null },
}

for (const [key, value] of Object.entries(expoGlobals)) {
  if (typeof globalThis[key] === 'undefined') {
    Object.defineProperty(globalThis, key, {
      value,
      writable: true,
      configurable: true,
    })
  }
}

// Ensure structuredClone exists (Node 17+ has it natively, but expo tries to polyfill it)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (val) => JSON.parse(JSON.stringify(val))
}

// Mock NativeWind cssInterop
jest.mock('nativewind', () => {
  return {
    cssInterop: jest.fn(),
    remapProps: jest.fn(),
    styled: (component) => component,
    colorScheme: { get: jest.fn(() => 'light'), set: jest.fn() },
  }
})

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View
  return {
    GestureHandlerRootView: View,
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    PanGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    NativeViewGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    ScrollView: require('react-native').ScrollView,
    Slider: View,
    Switch: View,
    TextInput: require('react-native').TextInput,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeGesture: {},
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
    Gesture: {
      Pan: jest.fn(() => ({
        onStart: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      })),
      Tap: jest.fn(() => ({
        onStart: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      })),
    },
    GestureDetector: View,
  }
})

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const RN = require('react-native')
  const mockDefault = {
    call: jest.fn(),
    createAnimatedComponent: (component) => component,
    addWhitelistedNativeProps: jest.fn(),
    addWhitelistedUIProps: jest.fn(),
    View: RN.View,
    Text: RN.Text,
    Image: RN.Image,
    ScrollView: RN.ScrollView,
    FlatList: RN.FlatList,
  }
  const easingFn = jest.fn((val) => val)
  return {
    __esModule: true,
    default: mockDefault,
    createAnimatedComponent: (component) => component,
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedProps: jest.fn(() => ({})),
    useDerivedValue: jest.fn((fn) => ({ value: fn() })),
    useAnimatedGestureHandler: jest.fn(),
    useAnimatedScrollHandler: jest.fn(),
    withTiming: jest.fn((val) => val),
    withSpring: jest.fn((val) => val),
    withRepeat: jest.fn((val) => val),
    withDelay: jest.fn((_, val) => val),
    withSequence: jest.fn((...vals) => vals[vals.length - 1]),
    withDecay: jest.fn((val) => val),
    interpolate: jest.fn((val) => val),
    Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    Easing: {
      linear: easingFn,
      ease: easingFn,
      in: easingFn,
      out: easingFn,
      inOut: easingFn,
      bezier: jest.fn(() => easingFn),
      bezierFn: jest.fn(() => easingFn),
    },
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    cancelAnimation: jest.fn(),
    View: RN.View,
    Text: RN.Text,
    Image: RN.Image,
    ScrollView: RN.ScrollView,
    FlatList: RN.FlatList,
  }
})

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReactBS = require('react')
  return {
    __esModule: true,
    default: mockReactBS.forwardRef((props, ref) =>
      mockReactBS.createElement('View', { ref, ...props })
    ),
    BottomSheetModal: mockReactBS.forwardRef((props, ref) =>
      mockReactBS.createElement('View', { ref, ...props })
    ),
    BottomSheetView: (props) => mockReactBS.createElement('View', props),
    BottomSheetBackdrop: (props) => mockReactBS.createElement('View', props),
    BottomSheetScrollView: (props) => mockReactBS.createElement('View', props),
    BottomSheetFlatList: (props) => mockReactBS.createElement('View', props),
    BottomSheetModalProvider: (props) => mockReactBS.createElement('View', props),
    useBottomSheet: jest.fn(() => ({
      close: jest.fn(),
      expand: jest.fn(),
      snapToIndex: jest.fn(),
    })),
    useBottomSheetModal: jest.fn(() => ({ dismiss: jest.fn(), present: jest.fn() })),
  }
})

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: 'Link',
  Tabs: {
    Screen: 'Tabs.Screen',
  },
}))

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const mockReact = require('react')
  const mockCreateIcon = (name) => {
    const MockIcon = (props) =>
      mockReact.createElement('View', { ...props, testID: `icon-${name}` })
    MockIcon.displayName = name
    return MockIcon
  }
  return new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === '__esModule') return true
        return mockCreateIcon(prop)
      },
    }
  )
})

// Mock expo-localization
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US' }],
  getCalendars: () => [{ calendar: 'gregory', timeZone: 'America/New_York' }],
  locale: 'en-US',
  locales: ['en-US'],
  timezone: 'America/New_York',
  isRTL: false,
}))

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    contains: jest.fn(() => false),
    getAllKeys: jest.fn(() => []),
  })),
}))

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}))

// Mock react-native safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}))

// Silence console warnings in tests
const originalWarn = console.warn
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Reanimated')) return
  originalWarn(...args)
}
