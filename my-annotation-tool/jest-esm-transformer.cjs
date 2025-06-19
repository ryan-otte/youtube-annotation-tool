const babelJest = require('babel-jest').default;

const customJestTransformer = babelJest.createTransformer({
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: ['@babel/plugin-transform-modules-commonjs']
});

module.exports = customJestTransformer;