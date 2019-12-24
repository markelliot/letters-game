const HtmlWebpackPlugin = require("html-webpack-plugin")
const path = require('path');

module.exports = {
  mode: "development",
  entry: "./src/main/ts/app.tsx",
  output: {
    path: path.join(__dirname, "build/assets"),
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "./src/main/html/index.html"
    })
  ],
  devServer: {
    contentBase: "./build/assets",
    compress: true,
    port: 8080
  }
};
