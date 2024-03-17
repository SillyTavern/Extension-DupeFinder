const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: path.join(__dirname, 'src/index.js'),
    output: {
        path: path.join(__dirname, 'dist/'),
        filename: `index.js`,
        publicPath: '/scripts/extensions/third-party/Extension-DupeFinder/dist/',
    },
    module: {
        rules: [
            {
                test: /\.js/,
                exclude: /node_modules/,
                options: {
                    cacheDirectory: true,
                    presets: [
                        '@babel/preset-env',
                        ['@babel/preset-react', { runtime: 'automatic' }],
                    ],
                },
                loader: 'babel-loader',
            },
        ],
    },
    optimization: {
        minimize: false,
        minimizer: [new TerserPlugin({
            extractComments: false,
        })],
    },
};
