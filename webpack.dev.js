/*
 * @FilePath: \webpack5\webpack.dev.js
 * @Description: webpack dev config
 * @Author: humandetail
 * @Date: 2021-03-17 00:20:53
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-18 16:26:32
 */

const CommonConfig = require('./webpack.common');
const { merge } = require('webpack-merge');
const webpack = require('webpack');

module.exports = merge(CommonConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    hot: true
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
});
