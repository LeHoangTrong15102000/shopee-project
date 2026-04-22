module.exports = function (api) {
  api.cache(true)
  const isTest = process.env.NODE_ENV === 'test'
  let plugins = []

  plugins.push('react-native-worklets/plugin')
  plugins.push([
    'module-resolver',
    {
      root: ['./'],
      alias: {
        '@': './',
      },
    },
  ])

  const presets = isTest
    ? ['babel-preset-expo']
    : [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel']

  return {
    presets,
    plugins,
  }
}
