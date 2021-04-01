/*
 * @FilePath: \linkup-ts\webpack.prod.js
 * @Description: webpack production config
 * @Author: humandetail
 * @Date: 2021-03-17 00:28:52
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-30 16:41:15
 */

const CommonConfig = require('./webpack.common');
const { merge } = require('webpack-merge');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
// const ClosurePlugin = require('closure-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(CommonConfig, {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(),
      // new ClosurePlugin({
      //   mode: 'STANDARD'
      // })
      new TerserPlugin()
    ]
  }
});
