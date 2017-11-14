const path = require('path');

const Uglify = require('uglifyjs-webpack-plugin');
const Copy = require('copy-webpack-plugin');
const ExtractText = require('extract-text-webpack-plugin');

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
          test: /\.(sass|scss)$/,
          loader: ExtractText.extract({
            use: [
              { loader: "css-loader", options: { sourceMap: false } },
              { loader: "sass-loader", options: { sourceMap: false } }
            ]
          })
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
    plugins: [
      new Copy([
        { from: '**/*.html', to: './' }
      ], {
        ignore: ['*.ts', '*.scss']
      }),
      new Uglify({
        sourceMap: false,
        test: /\.min\.js$/
      }),
      new ExtractText({
        filename: 'styles/schedui.css',
        allChunks: true
      })
    ],
    cache: true,
    devServer: {
      contentBase: './dist',
      compress: true,
      publicPath: '/',
      setup: (app) => {
        app.get('/lib/*', (req, res) => {
          let resourcePath = req.originalUrl.replace('/lib', '');
          res.sendFile(resourcePath, {root: './node_modules'});
        });
      }
    }
  }
];
