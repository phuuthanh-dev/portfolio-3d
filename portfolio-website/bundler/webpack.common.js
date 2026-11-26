const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

// Both sites use the same profile. A generic fallback keeps this checkout
// buildable on its own; restart webpack if the shared file is added later.
const sharedConfig = path.resolve(__dirname, '../../portfolio-inner-site/src/portfolio.config.json');
const fallbackConfig = path.resolve(__dirname, '../src/portfolio.fallback.json');
const configPath = fs.existsSync(sharedConfig) ? sharedConfig : fallbackConfig;
const innerSiteUrl = (process.env.INNER_SITE_URL || '').trim();

// Vercel deploys need both the shared profile and an HTTPS inner site.
// Failing here avoids a successful deployment with a generic name or blank screen.
if (process.env.VERCEL === '1' || process.env.PORTFOLIO_REQUIRE_INNER === '1') {
    if (!fs.existsSync(sharedConfig)) {
        throw new Error('Missing shared portfolio config. Enable source files outside the Vercel Root Directory.');
    }
    let validInnerSiteUrl = false;
    try {
        const url = new URL(innerSiteUrl);
        validInnerSiteUrl = url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
    } catch (_) {
        // Missing or malformed URL; report a single actionable error below.
    }
    if (!validInnerSiteUrl) {
        throw new Error('Set INNER_SITE_URL to the deployed inner site HTTPS URL in Vercel before building.');
    }
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

class PortfolioMetadataPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap('PortfolioMetadataPlugin', (compilation) => {
            compilation.fileDependencies.add(configPath);
            HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tap(
                'PortfolioMetadataPlugin',
                (data) => {
                    const { profile } = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                    const name = profile.name || 'Portfolio';
                    const title = profile.title || 'Software Engineer';
                    const values = {
                        __PROFILE_NAME__: name,
                        __PROFILE_TITLE__: title,
                        __PROFILE_DESCRIPTION__: `${name} - ${title}`,
                    };
                    for (const [placeholder, value] of Object.entries(values)) {
                        data.html = data.html.split(placeholder).join(escapeHtml(value));
                    }
                    return data;
                }
            );
        });
    }
}

module.exports = {
    entry: path.resolve(__dirname, '../src/script.ts'),
    output: {
        hashFunction: 'xxhash64',
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, '../public'),
    },
    devtool: 'source-map',
    plugins: [
        new CopyWebpackPlugin({
            patterns: [{ from: path.resolve(__dirname, '../static') }],
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/index.html'),
            favicon: path.resolve(__dirname, '../static/images/tp-logo.svg'),
            minify: true,
        }),
        new MiniCSSExtractPlugin(),
        new PortfolioMetadataPlugin(),
        new webpack.DefinePlugin({
            __INNER_SITE_URL__: JSON.stringify(innerSiteUrl),
        }),
    ],
    resolve: {
        alias: {
            three: path.resolve('./node_modules/three'),
            '@portfolio-config': configPath,
        },
        extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
        rules: [
            // HTML
            {
                test: /\.(html)$/,
                use: ['html-loader'],
            },
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            // JS
            {
                test: /\.tsx$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },

            // CSS
            {
                test: /\.css$/,
                use: [MiniCSSExtractPlugin.loader, 'css-loader'],
            },

            // Images
            {
                test: /\.(jpg|png|gif|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/images/[hash][ext]',
                },
            },
            // Audio
            {
                test: /\.(mp3|wav)$/,
                loader: 'file-loader',
                options: {
                    name: '[path][name].[ext]',
                },
            },
            // Fonts
            {
                test: /\.(ttf|eot|woff|woff2)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/fonts/[hash][ext]',
                },
            },
            // Shaders
            {
                test: /\.(glsl|vs|fs|vert|frag)$/,
                exclude: /node_modules/,
                use: ['glslify-import-loader', 'raw-loader', 'glslify-loader'],
            },
        ],
    },
};
