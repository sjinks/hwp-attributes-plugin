# hwp-attributes-plugin

[![Build and Test](https://github.com/sjinks/hwp-attributes-plugin/actions/workflows/build.yml/badge.svg)](https://github.com/sjinks/hwp-attributes-plugin/actions/workflows/build.yml)
[![CodeQL](https://github.com/sjinks/hwp-attributes-plugin/actions/workflows/codeql.yml/badge.svg)](https://github.com/sjinks/hwp-attributes-plugin/actions/workflows/codeql.yml)

Plugin to add various attributes to script tags injected by [html-webpack-plugin](https://www.npmjs.com/package/html-webpack-plugin)

## Installation

```shell
npm i -D hwp-attributes-plugin
```

## Usage

```js
import { HwpAttributesPlugin } from 'hwp-attributes-plugin';

// Webpack configuration object
export default {

    plugins: [
        new HtmlWebpackPlugin({ /* ... */ }),
        new HwpAttributesPlugin({
            module: ['**.mjs'],
            nomodule: ['polyfills.js'],
            async: ['some-async-script.js', 'another-async-script.js'],
            defer: ['script-to-defer.*.js'],
        }),
    ],
};
```

To configure the plugin, pass an object with the following keys to its constructor (all keys are optional):
  * `module`: patterns of scripts that should have the `module` attribute added;
  * `nomodule`: patterns of scripts that should have the `nomodule` attribute added;
  * `async`: patterns of scripts that should have the `async` attribute added;
  * `defer`: patterns of scripts that should have the `defer` attribute added.

The plugin performs pattern matching with the help of [minimatch](https://www.npmjs.com/package/minimatch).

The `module` and `nomodule` attributes are mutually exclusive, `module` takes precedence. If the same file matches both `module` and `nomodule` patterns, it will have the `module` attribute.
