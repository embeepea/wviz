var webpack = require('webpack');

var PROD = JSON.parse(process.env.PROD_ENV || '0');

module.exports = {
    entry: [
        "./main.js"
    ],
    output: {
        path: __dirname,
        filename: PROD ? 'all.min.js' : 'all.js'
    },
    plugins: PROD ? [
        new webpack.optimize.UglifyJsPlugin({minimize: true})
    ] : [],
    module: {
        loaders: [
            { test: /\.css$/,                                     loader: "style!css" },
            { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,      loader: "url-loader?limit=500000&mimetype=application/font-woff" },
            { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=500000&mimetype=application/octet-stream" },
            { test: /\.png$/,                                     loader: "url-loader?limit=500000&mimetype=image/png" },
            { test: /\.jpg$/,                                     loader: "url-loader?limit=500000&mimetype=image/jpeg" }
        ],
        noParse: [/libs\/jquery/]
    }
};
