module.exports = {
  cssInterop: jest.fn(),
  remapProps: jest.fn(),
  createInteropElement: jest.fn((type, props, ...children) => {
    const React = require('react');
    return React.createElement(type, props, ...children);
  }),
  useColorScheme: jest.fn(() => ({ colorScheme: 'light', setColorScheme: jest.fn(), toggleColorScheme: jest.fn() })),
  useUnstableNativeVariable: jest.fn(() => ''),
  vars: jest.fn(() => ({})),
  StyleSheet: {
    create: (styles) => styles,
    flatten: (styles) => Object.assign({}, ...([].concat(styles).filter(Boolean))),
  },
};
