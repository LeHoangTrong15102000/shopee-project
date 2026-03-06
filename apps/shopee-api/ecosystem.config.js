module.exports = {
  apps: [
    {
      name: 'index',
      script: 'build/src/index.js',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
