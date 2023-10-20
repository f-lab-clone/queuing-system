jest.setTimeout(30000)

const chai = require('chai')
const chaiHttp = require('chai-http')
const { GenericContainer } = require('testcontainers')
const expect = chai.expect
chai.use(chaiHttp)

describe('Ticket', () => {
  let redis = null
  let ticketStoreService = null
  let jobService = null

  beforeAll(async () => {
    container = await new GenericContainer('redis')
      .withExposedPorts(6379)
      .start()
    process.env = {
      NODE_ENV: 'test',
      REDIS_HOST: container.getHost(),
      REDIS_PORT: container.getMappedPort(6379),
    }

    require('../../../src/config')
    await $require('loaders')()
    redis = $require('loaders/redis')
    const TicketStoreService = $require('services/ticketStore')
    const JobService = $require('services/jobService')
    ticketStoreService = new TicketStoreService(redis)
    jobService = new JobService(ticketStoreService)
  })

  beforeEach(async () => {
    await redis.flushAll()
  })

  describe('Job.getTotalEvent', () => {
    it('should return [] when no event in queue', async () => {
      const result = await jobService.getTotalEvent()
      expect(result).to.deep.equal([])
    })
    it('should return [{event_id, timestamp}] when no event in queue', async () => {
      const { timestamp } = await ticketStoreService.updateQueue(1)
      const result = await jobService.getTotalEvent()
      expect(result).to.deep.equal([{ event_id: 1, timestamp }])
    })
  })
})
