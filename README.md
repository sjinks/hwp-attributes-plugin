# hwp-attributes-plugin

![CI](https://github.com/sjinks/hwp-attributes-plugin/workflows/CI/badge.svg)

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

To configure the plugin, just pass an object with the following keys to its constructor (all keys are optional):
  * `module`: patterns of scripts which should have `module` attribute added;
  * `nomodule`: patterns of scripts which should have `nomodule` attribute added;
  * `async`: patterns of scripts which should have `async` attribute added;
  * `defer`: patterns of scripts which should have `defer` attribute added.

Pattern matching is performed with the help of [minimatch](https://www.npmjs.com/package/minimatch).

`module` and `nomodule` attributes are mutually exclusive, `module` takes precedence. That is, if the same file matches both `module` and `nomodule` patterns, it will have `module` attribute.
