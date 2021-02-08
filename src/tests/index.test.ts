import path from 'path';
import webpack from 'webpack';
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

const writeFile = (arg0: string, arg1: string | Buffer, arg2: (arg0?: NodeJS.ErrnoException) => void): void =>
    fs.writeFile(arg0, arg1, (error) => arg2(error || undefined));

const mkdir = (arg0: string, arg1: (arg0?: NodeJS.ErrnoException) => void): void =>
    fs.mkdir(arg0, (error) => arg1(error || undefined));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stat = (arg0: string, arg1: (arg0?: NodeJS.ErrnoException, arg1?: any) => void): void =>
    fs.stat(arg0, (error, stats) => arg1(error || undefined, stats));

const readFile = (arg0: string, arg1: (arg0?: NodeJS.ErrnoException, arg1?: string | Buffer) => void): void =>
    fs.readFile(arg0, (error, buf) => arg1(error || undefined, buf));

const rmdir = (arg0: string, arg1: (arg0?: NodeJS.ErrnoException) => void): void =>
    fs.mkdir(arg0, (error) => arg1(error || undefined));

const unlink = (arg0: string, arg1: (arg0?: NodeJS.ErrnoException) => void): void =>
    fs.unlink(arg0, (error) => arg1(error || undefined));

const filesystem = {
    join: path.join,
    mkdir: mkdir,
    mkdirp: fs.mkdirp,
    rmdir: rmdir,
    unlink: unlink,
    writeFile: writeFile,
    stat: stat,
    readFile: readFile,
    relative: path.relative,
    dirname: path.dirname,
};

function getOutput(): string {
    const htmlFile = '/build/index.html';
    const htmlContents = fs.readFileSync(htmlFile).toString('utf8');
    return htmlContents;
}

afterEach((): void => vol.reset());

describe('HwpAttributesPlugin', (): void => {
    it('should do nothing with empty config', (done): void => {
        const compiler = webpack({
            ...webpackConfig,
            plugins: [new HtmlWebpackPlugin(hwpOptions), new HwpAttributesPlugin()],
        });

        compiler.outputFileSystem = filesystem;
        compiler.run((err?: Error): void => {
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
        compiler.run((err?: Error): void => {
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
