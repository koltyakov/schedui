const path = require('path');

const Uglify = require('uglifyjs-webpack-plugin');
const Copy = require('copy-webpack-plugin');

const fs = require('fs');
const gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(fs);

module.exports = [
  {
    context: path.join(__dirname, 'src'),
    entry: {
      'schedui': './scripts/index.ts',
      'schedui.min': './scripts/index.ts',
      '../example/example': './example/index.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: './scripts/[name].js',
      library: 'SchedUI'
    },
    externals: {
      "jquery": "jQuery",
      "jqueryui": "jQuery",
      "moment": "moment"
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    plugins: [
      new Copy([
        { from: '**/*.html', to: './' }
      ], {
        ignore: ['*.ts', '*.scss']
      }),
      new Uglify({
        sourceMap: false,
        test: /\.min\.js$/,
      })
    ],
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          exclude: /(node_modules|dist)/,
          use: ['awesome-typescript-loader'],
        },
        {
          test: /\.scss$/,
          loaders: ['css-loader', 'sass-loader']
        },
        {
          test: /\.(gif|png|jpe?g|svg)$/i,
          use: [
            'file-loader?publicPath=/..&name=/images/[hash].[ext]', {
              loader: 'image-webpack-loader',
              options: {
                bypassOnDebug: true,
              }
            }
          ]
        }
      ]
    },
    cache: true,
    devServer: {
      contentBase: './dist',
      publicPath: '/'
    }
  }
];
