module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './src',
          },
        },
      ],
      // Required for react-native-reanimated (must be last)
      'react-native-reanimated/plugin',
    ],
  };
};
