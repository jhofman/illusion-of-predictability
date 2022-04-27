const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'prob.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
