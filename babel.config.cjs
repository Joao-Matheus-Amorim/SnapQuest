module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // O plugin de worklets habilita Reanimated 4 / Skia animado.
    // DEVE ser o ultimo plugin da lista.
    plugins: ["react-native-worklets/plugin"],
  };
};
