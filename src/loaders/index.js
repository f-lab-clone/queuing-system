const Logger = require('./logger')
const Redis = require('./redis')

module.exports = async (app) => {
  await Redis.connect()
  Logger.info('Redis connected')
}
