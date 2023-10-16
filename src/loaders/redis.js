const redis = require('redis')
const config = $require('config')
const Logger = $require('loaders/logger')

const URL = `redis://${config.redis.host}:${config.redis.port}`
const client = redis.createClient({
  url: URL,
})
module.exports = client
