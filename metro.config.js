const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Block @expo/ui src files from being resolved directly
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect @expo/ui/jetpack-compose to a stub
  if (moduleName === '@expo/ui/jetpack-compose' || 
      moduleName.startsWith('@expo/ui/src/')) {
    return {
      type: 'empty',
    };
  }
  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;
