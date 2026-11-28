const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add tflite to asset extensions so Metro can resolve the model file
config.resolver.assetExts.push("tflite");

module.exports = withNativeWind(config, { input: "./global.css" });
