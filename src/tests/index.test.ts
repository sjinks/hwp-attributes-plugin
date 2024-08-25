import { equal } from 'node:assert/strict';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';
import webpack, { type Compiler, type Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fs, vol } from 'memfs';
import { load } from 'cheerio';
import { HwpAttributesPlugin } from '../';

const hwpOptions: HtmlWebpackPlugin.Options = {
    filename: 'index.html',
    scriptLoading: 'blocking',
    hash: false,
    minify: {
        collapseWhitespace: true,
        removeRedundantAttributes: true,
    },
    showErrors: true,
    template: path.join(__dirname, './data/index.html'),
};

const webpackConfig: Configuration = {
    mode: 'development',
    entry: {
        script1: path.join(__dirname, './data/script1.js'),
        script2: path.join(__dirname, './data/script2.js'),
        polyfills: path.join(__dirname, './data/polyfills.js'),
    },
    output: {
        path: '/build',
    },
};

const filesystem = {
    join: path.join,
    mkdir: fs.mkdir,
    rmdir: fs.rmdir,
    unlink: fs.unlink,
    writeFile: fs.writeFile,
    stat: fs.stat,
    readFile: fs.readFile,
    relative: path.relative,
    dirname: path.dirname,
} as Compiler['outputFileSystem'];

function getOutput(): string {
    const htmlFile = '/build/index.html';
    return fs.readFileSync(htmlFile).toString('utf8');
}

describe('HwpAttributesPlugin', (): void => {
    afterEach((): void => vol.reset());

    it('should do nothing with empty config', (_, done): void => {
        const compiler = webpack({
            ...webpackConfig,
            plugins: [new HtmlWebpackPlugin(hwpOptions), new HwpAttributesPlugin()],
        });

        compiler.outputFileSystem = filesystem;
        compiler.run((err): void => {
            try {
                equal(err, null);
                const html = getOutput();
                const $ = load(html);

                const scripts = $('script');
                equal(scripts.get().length, 3);
                scripts.each((index, element): void => {
                    const keys = Object.keys(element.attribs);
                    equal(keys.includes('src'), true);
                    equal(keys.includes('type'), false);
                    equal(keys.includes('nomodule'), false);
                    equal(keys.includes('async'), false);
                    equal(keys.includes('defer'), false);
                });

                setImmediate(done);
            } catch (e) {
                setImmediate(done, e);
            }
        });
    });

    it('should add proper attributes to matched items', (_, done): void => {
        const compiler = webpack({
            ...webpackConfig,
            plugins: [
                new HtmlWebpackPlugin(hwpOptions),
                new HwpAttributesPlugin({
                    module: ['script1*'],
                    nomodule: ['polyfills*'],
                    async: ['script2*'],
                    defer: ['script2*'],
                }),
            ],
        });

        compiler.outputFileSystem = filesystem;
        compiler.run((err): void => {
            try {
                equal(err, null);
                const html = getOutput();
                const $ = load(html);

                const script1 = $('script[src^="script1"]');
                const script2 = $('script[src^="script2"]');
                const script3 = $('script[src^="polyfill"]');

                equal(script1.get().length, 1);
                equal(script2.get().length, 1);
                equal(script3.get().length, 1);

                let keys = Object.keys(script1.get(0)!.attribs);
                equal(keys.includes('type'), true);
                equal(script1.get(0)!.attribs['type'], 'module');
                equal(keys.includes('nomodule'), false);
                equal(keys.includes('async'), false);
                equal(keys.includes('defer'), false);

                keys = Object.keys(script2.get(0)!.attribs);
                equal(keys.includes('type'), false);
                equal(keys.includes('nomodule'), false);
                equal(keys.includes('async'), true);
                equal(keys.includes('defer'), true);

                keys = Object.keys(script3.get(0)!.attribs);
                equal(keys.includes('type'), false);
                equal(keys.includes('nomodule'), true);
                equal(keys.includes('async'), false);
                equal(keys.includes('defer'), false);

                setImmediate(done);
            } catch (e) {
                setImmediate(done, e);
            }
        });
    });
});
