/*
 * @FilePath: \webpack5\webpack.common.js
 * @Description: webpack common config
 * @Author: humandetail
 * @Date: 2021-03-16 23:22:52
 * @LastEditors: humandetail
 * @LastEditTime: 2021-03-18 16:25:45
 */

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProductionMode = process.env.NODE_ENV === 'production';
const resolve = (filepath) => {
  return path.resolve(__dirname, filepath);
};

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: '[name].[hash:5].js',
    path: resolve('dist'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: 'defaults'
                }
              ]
            ],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          isProductionMode
            ? MiniCssExtractPlugin.loader
            : 'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      
      {
        test: /\.css$/,
        use: [
          isProductionMode
            ? MiniCssExtractPlugin.loader
            : 'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      },

      {
        test: /\.(png|jpeg|jpg|gif|svg)/i,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: isProductionMode
        ? '[name].[contenthash].css'
        : '[name].css',
      chunkFilename: isProductionMode
        ? '[id].[contenthash].css'
        : '[id].css'
    }),

    new HtmlWebpackPlugin({
      title: '测试webpack5',
      template: resolve('./src/index.html')
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};