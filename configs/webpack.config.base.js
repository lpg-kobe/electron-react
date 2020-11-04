/**
 * Base webpack config used across other specific configs
 */

import path from 'path'
import webpack from 'webpack'
import { dependencies as externals } from '../app/package.json'
import { readFile2Json } from './tool'

const appRoot = path.join(__dirname, '..', 'app')
const { defineKey } =
  process.env.NODE_ENV === 'production'
    ? readFile2Json(path.join(appRoot, './.env.prod'))
    : readFile2Json(path.join(appRoot, './.env.dev'))

export default {
  externals: [...Object.keys(externals || {})],

  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.node$/,
        loader: 'native-ext-loader',
        options: {
          emit: false,
          // find trtc-sdk file before package
          rewritePath:
            process.env.NODE_ENV === 'production'
              ? './'
              : 'node_modules/trtc-electron-sdk/build/Release/'
        }
      }
    ]
  },

  output: {
    path: appRoot,
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2'
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [appRoot, 'node_modules'],
    alias: {
      '@': appRoot
    }
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production'
    }),

    new webpack.DefinePlugin(defineKey),

    new webpack.NamedModulesPlugin()
  ]
}
