const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Use port 8082 to avoid conflict with Docker on 8081
config.server = {
  ...config.server,
  port: 8082,
};

module.exports = config;
