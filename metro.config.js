const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block @expo/ui from loading .ts source files directly
config.resolver.blockList = [
  /node_modules\/@expo\/ui\/src\/.*/,
];

config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;
