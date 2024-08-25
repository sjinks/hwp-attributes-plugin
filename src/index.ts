import type { Compilation, Compiler } from 'webpack';
import HtmlWebpackPlugin, { type HtmlTagObject } from 'html-webpack-plugin';
import { minimatch } from 'minimatch';

export interface Options {
    module?: string[];
    nomodule?: string[];
    async?: string[];
    defer?: string[];
}

const PLUGIN = 'HwpAttributesPlugin';

export class HwpAttributesPlugin {
    private readonly _options: Required<Options>;

    public constructor(options: Options = {}) {
        this._options = {
            module: options.module ?? [],
            nomodule: options.nomodule ?? [],
            async: options.async ?? [],
            defer: options.defer ?? [],
        };
    }

    public apply(compiler: Compiler): void {
        compiler.hooks.compilation.tap(PLUGIN, (compilation: Compilation): void => {
            const hooks = HtmlWebpackPlugin.getHooks(compilation);
            hooks.alterAssetTags.tapAsync(PLUGIN, (data, cb): void => {
                data.assetTags.scripts = this._transformAssets(data.assetTags.scripts);
                cb(null, data);
            });
        });
    }

    private _transformAssets(assets: HtmlTagObject[]): HtmlTagObject[] {
        return assets.map((asset: HtmlTagObject): HtmlTagObject => {
            if (asset.tagName === 'script' && asset.attributes.src) {
                const module = this._options.module.some((pattern: string): boolean =>
                    minimatch(`${asset.attributes.src}`, pattern),
                );

                const nomodule =
                    !module &&
                    this._options.nomodule.some((pattern: string): boolean =>
                        minimatch(`${asset.attributes.src}`, pattern),
                    );

                const async = this._options.async.some((pattern: string): boolean =>
                    minimatch(`${asset.attributes.src}`, pattern),
                );

                const defer = this._options.defer.some((pattern: string): boolean =>
                    minimatch(`${asset.attributes.src}`, pattern),
                );

                if (module) {
                    asset.attributes.type = 'module';
                } else if (nomodule) {
                    asset.attributes.nomodule = true;
                }

                if (async) {
                    asset.attributes.async = true;
                }

                if (defer) {
                    asset.attributes.defer = true;
                }
            }

            return asset;
        });
    }
}
