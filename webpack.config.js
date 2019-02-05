const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const WebpackNotifierPlugin = require('webpack-notifier')

const BUILD_DIR = path.resolve(__dirname, 'dist')
const APP_DIR = path.resolve(__dirname, 'src')

const rendererConfig = {
  mode: 'development',

  entry: APP_DIR + '/renderer/index.js',
  output: {
    path: BUILD_DIR + '/renderer/',
    filename: 'renderer.js'
  },
  target: 'electron-renderer',
  node: {
    net: 'empty',
    fs: 'empty',
    __dirname: false,
    __filename: false
  },
  module: {
    rules: [{
      test: /\.sass$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [{
          loader: 'css-loader'
        }, {
          loader: 'sass-loader'
        }]
      })
    }, { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }]
  },
  optimization: {
    minimize: false
  },
  plugins: [
    new WebpackNotifierPlugin({ title: 'rendererConfig', alwaysNotify: true, excludeWarnings: true }),
    new ExtractTextPlugin({
      filename: '../css/[name].css?[name]',
      disable: false,
      allChunks: true
    }),
    new HtmlWebpackPlugin({
      title: 'Movie Mirror',
      template: './src/renderer/index.html',
      inject: 'body',
      hash: 'true'
    })
  ],
  watch: true
}
const mainConfig = {
  mode: 'development',
  entry: APP_DIR + '/main/index.js',
  output: {
    path: BUILD_DIR + '/main/',
    filename: 'main.js'
  },
  target: 'electron-main',
  node: {
    net: 'empty',
    fs: 'empty',
    __dirname: false,
    __filename: false
  },
  optimization: {
    minimize: false
  },
  watch: true
}

module.exports = [mainConfig, rendererConfig]
