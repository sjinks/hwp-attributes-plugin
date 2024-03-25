import path from 'path';
import webpack, { type Compiler } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fs, vol } from 'memfs';
import cheerio from 'cheerio';
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

const webpackConfig: webpack.Configuration = {
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

afterEach((): void => vol.reset());

describe('HwpAttributesPlugin', (): void => {
    it('should do nothing with empty config', (done): void => {
        const compiler = webpack({
            ...webpackConfig,
            plugins: [new HtmlWebpackPlugin(hwpOptions), new HwpAttributesPlugin()],
        });

        compiler.outputFileSystem = filesystem;
        compiler.run((err): void => {
            try {
                expect(err).toBeFalsy();
                const html = getOutput();
                const $ = cheerio.load(html);

                const scripts = $('script');
                expect(scripts.get()).toHaveLength(3);
                scripts.each((index, element: cheerio.Element): void => {
                    const keys = Object.keys((element as cheerio.TagElement).attribs);
                    expect(keys).toContain('src');
                    expect(keys).not.toContain('type');
                    expect(keys).not.toContain('nomodule');
                    expect(keys).not.toContain('async');
                    expect(keys).not.toContain('defer');
                });

                setImmediate(done);
            } catch (e) {
                setImmediate(done, e);
            }
        });
    });

    it('should add proper attributes to matched items', (done): void => {
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
                expect(err).toBeFalsy();
                const html = getOutput();
                const $ = cheerio.load(html);

                const script1 = $('script[src^="script1"]');
                const script2 = $('script[src^="script2"]');
                const script3 = $('script[src^="polyfill"]');

                expect(script1.get()).toHaveLength(1);
                expect(script2.get()).toHaveLength(1);
                expect(script3.get()).toHaveLength(1);

                let keys = Object.keys((script1.get(0) as cheerio.TagElement).attribs);
                expect(keys).toContain('type');
                expect((script1.get(0) as cheerio.TagElement).attribs['type']).toBe('module');
                expect(keys).not.toContain('nomodule');
                expect(keys).not.toContain('async');
                expect(keys).not.toContain('defer');

                keys = Object.keys((script2.get(0) as cheerio.TagElement).attribs);
                expect(keys).not.toContain('type');
                expect(keys).not.toContain('nomodule');
                expect(keys).toContain('async');
                expect(keys).toContain('defer');

                keys = Object.keys((script3.get(0) as cheerio.TagElement).attribs);
                expect(keys).not.toContain('type');
                expect(keys).toContain('nomodule');
                expect(keys).not.toContain('async');
                expect(keys).not.toContain('defer');

                setImmediate(done);
            } catch (e) {
                setImmediate(done, e);
            }
        });
    });
});
