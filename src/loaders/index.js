const expressLoader = require('./express')
const Logger = require('./logger')
const Redis = require('./redis')

module.exports = async (app) => {
  await Redis.connect()
  Logger.info('Redis connected')
  expressLoader(app)
  Logger.info('Express loaded')
}
