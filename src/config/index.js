require('dotenv').config()
const path = require('path')
global.$require = (pathname) => require(path.join(__dirname, '../' + pathname))

const normalizePort = (val) => {
  const port = parseInt(val, 10)
  if (isNaN(port)) return val
  if (port >= 0) return port
  return false
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  port: normalizePort(process.argv[2] || process.env.PORT),
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },

  job: {
    inteval: process.env.JOB_INTEVAL,
    movePerInvetal: process.env.JOB_MOVE_PER_INTEVAL,
    expiredMinute: process.env.JOB_TICKET_EXPIRED_MINUTE,
  },

  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  },
}
