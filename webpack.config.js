module.exports = {
  entry: "./src/phlux.js",
  output: {
    path: "./dist/",
    library: "Phlux",
    filename: "phlux.js",
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      { test: /\.js?$/, exclude: /node_modules/, loader: "babel-loader"}
    ]
  }
}
