const config = require('./config')
const Logger = $require('loaders/logger')

async function start() {
  await $require('loaders')()

  Logger.info(`
    🛡️  Job Started 🛡️
  `)

  module.exports = app
}

start()
