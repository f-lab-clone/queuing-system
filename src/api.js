const config = require('./config')
const express = require('express')
const Logger = $require('loaders/logger')

function startServer() {
  const app = express()

  $require('loaders')(app)

  app.listen(config.port, (err) => {
    if (err) {
      Logger.error(err)
      process.exit(1)
    }
    Logger.info(`
      🛡️  Server listening on port: ${config.port} 🛡️
    `)
  })

  module.exports = app
}

startServer()
