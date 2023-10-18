const chai = require('chai')
const chaiHttp = require('chai-http')
const { GenericContainer } = require('testcontainers')
const expect = chai.expect
chai.use(chaiHttp)

describe('Ticket', () => {
  let server = null
  let redis = null
  let ticketStoreService = null

  beforeAll(async () => {
    container = await new GenericContainer('redis')
      .withExposedPorts(6379)
      .start()
    process.env = {
      NODE_ENV: 'test',
      REDIS_HOST: container.getHost(),
      REDIS_PORT: container.getMappedPort(6379),
    }

    server = require('../../../src/api')
    redis = $require('loaders/redis')
    const TicketStoreService = $require('services/ticketStore')
    ticketStoreService = new TicketStoreService(redis)
  })

  beforeEach(async () => {
    await redis.flushAll()
  })
})
