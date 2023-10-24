const config = require('./config')
const express = require('express')
const Logger = $require('loaders/logger')
const expressLoader = require('./loaders/express')

function startServer() {
  const app = express()

  $require('loaders')(app)

  expressLoader(app)
  Logger.info('Express loaded')

  app.listen(config.port, (err) => {
    if (err) {
      Logger.error(err)
      process.exit(1)
    }
    Logger.info(`
      ----------------------------------------------
      🛡️  Server listening on port: ${config.port} 🛡️
          NODE_ENV: ${config.NODE_ENV}
      ----------------------------------------------
    `)
  })

  module.exports = app
}

startServer()
