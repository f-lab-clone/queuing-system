const expressLoader = require('./express')
const Logger = require('./logger')

module.exports = async (app) => {
  expressLoader(app)
  Logger.info('Express loaded')
}
