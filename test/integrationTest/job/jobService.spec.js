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
      JOB_INTEVAL: 1000,
      JOB_MOVE_PER_INTEVAL: 2,
      JOB_TICKET_EXPIRED_MINUTE: 3,
    }

    const config = require('../../../src/config')
    await $require('loaders')()
    redis = $require('loaders/redis')
    const TicketStoreService = $require('services/ticketStore')
    const JobService = $require('services/jobService')
    ticketStoreService = new TicketStoreService(redis)
    jobService = new JobService(ticketStoreService, config.job)
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

  describe('Job.moveEventToRunning', () => {
    it('should move event from waiting to running', async () => {
      const eventId = 1
      await ticketStoreService.pushIntoWaiting(eventId, 1)
      await ticketStoreService.pushIntoWaiting(eventId, 2)
      await ticketStoreService.pushIntoWaiting(eventId, 3)

      await jobService.moveEventToRunning(eventId)

      expect(await ticketStoreService.getLengthOfWaiting(eventId)).to.equal(1)
      expect(await ticketStoreService.getLengthOfRunning(eventId)).to.equal(2)
    })
  })

  describe('Job.removeExpiredTicket', () => {
    it('should remove expired ticket', async () => {
      const eventId = 100
      const ONE_MINUTE = 1000 * 60

      await redis.zAdd(ticketStoreService.getWaitingKeyByEventId(eventId), [
        { value: `1`, score: new Date().valueOf() - ONE_MINUTE * 4 },
        { value: `2`, score: new Date().valueOf() - ONE_MINUTE * 4 },
        { value: `3`, score: new Date().valueOf() - ONE_MINUTE * 1 },
      ])
      await redis.zAdd(ticketStoreService.getRunningKeyByEventId(eventId), [
        { value: `1`, score: new Date().valueOf() - ONE_MINUTE * 4 },
        { value: `2`, score: new Date().valueOf() - ONE_MINUTE * 4 },
      ])

      await jobService.removeExpiredTicket(eventId)
      expect(await ticketStoreService.getLengthOfWaiting(eventId)).to.equal(1)
      expect(await ticketStoreService.getLengthOfRunning(eventId)).to.equal(0)
    })
  })
})
