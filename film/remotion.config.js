import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);

// package.json が "type": "module" なので、拡張子なしの import が通るようにする
Config.overrideWebpackConfig((config) => ({
  ...config,
  module: {
    ...config.module,
    rules: [...(config.module?.rules ?? []), { test: /\.m?jsx?$/, resolve: { fullySpecified: false } }],
  },
}));
