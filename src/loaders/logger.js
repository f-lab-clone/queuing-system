const winston = require('winston')
const config = $require('config')

const transports = []
if (config.NODE_ENV === 'production') {
  transports.push(new winston.transports.Console())
} else {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.cli(),
        winston.format.splat(),
      ),
    }),
  )
}

if (config.NODE_ENV === 'test') {
  transports.forEach((transport) => {
    transport.silent = true
  })
}

const LoggerInstance = winston.createLogger({
  level: config.logs.level,
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({
      stack: true,
    }),
    winston.format.splat(),
    winston.format.json(),
  ),
  transports,
})

module.exports = LoggerInstance
