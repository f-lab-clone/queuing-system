jest.setTimeout(30000)
const { GenericContainer } = require('testcontainers')

const chai = require('chai')
const expect = chai.expect

const ONE_MINUTE = 1000 * 60

describe('Ticket', () => {
  let redis = null
  let ticketStoreService = null
  let jobService = null
  let container = null

  const testEventId = 1

  function addUserIntoQueue(key, userId, timestamp) {
    return redis.zAdd(key, [{ value: userId.toString(), score: timestamp }])
  }

  beforeAll(async () => {
    container = await new GenericContainer('redis').withExposedPorts(6379).start()
    process.env = {
      NODE_ENV: 'test',
      REDIS_HOST: container.getHost(),
      REDIS_PORT: container.getMappedPort(6379),
      JOB_INTEVAL_SEC: 60,
      JOB_MOVE_PER_INTEVAL: 2,
      JOB_TICKET_EXPIRED_SEC: 180,
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

  afterAll(async () => {
    await redis.disconnect()
    await container.stop()
  })

  describe('Job.getEventList', () => {
    it('should return [] when no event in queue', async () => {
      const result = await jobService.getEventList()
      expect(result).to.deep.equal([])
    })
    it('should return [{eventId, timestamp}] when no event in queue', async () => {
      const { timestamp } = await ticketStoreService.updateEventInList(1)
      const result = await jobService.getEventList()
      expect(result).to.deep.equal([{ eventId: testEventId, timestamp }])
    })
  })

  describe('Job.moveEventInToRunning', () => {
    it('should move event from waiting to running', async () => {
      await ticketStoreService.pushIntoWaiting(testEventId, 1)
      await ticketStoreService.pushIntoWaiting(testEventId, 2)
      await ticketStoreService.pushIntoWaiting(testEventId, 3)

      // MOVE_PER_INTEVAL = 2
      await jobService.moveEventInToRunning(testEventId)

      expect(await ticketStoreService.getLengthOfWaiting(testEventId)).to.equal(1)
      expect(await ticketStoreService.getLengthOfRunning(testEventId)).to.equal(2)
    })
  })

  describe('Job.removeExpiredTicket', () => {
    it('should remove expired ticket', async () => {
      const NOW = new Date().valueOf()
      const WAITING = ticketStoreService.getWaitingKeyByEventId(testEventId)
      await addUserIntoQueue(WAITING, 1, NOW - ONE_MINUTE * 4)
      await addUserIntoQueue(WAITING, 2, NOW - ONE_MINUTE * 4)
      await addUserIntoQueue(WAITING, 3, NOW)

      const RUNNING = ticketStoreService.getRunningKeyByEventId(testEventId)
      await addUserIntoQueue(RUNNING, 4, NOW - ONE_MINUTE * 4)
      await addUserIntoQueue(RUNNING, 5, NOW - ONE_MINUTE * 4)

      await jobService.removeExpiredTicket(testEventId)
      expect(await ticketStoreService.getLengthOfWaiting(testEventId)).to.equal(1)
      expect(await ticketStoreService.getLengthOfRunning(testEventId)).to.equal(0)
    })
  })

  describe('Job.removeExpiredEvent', () => {
    async function setup1hoursAgo() {
      await ticketStoreService.updateEventInList(testEventId)
      const NOW = new Date().valueOf()
      const ONE_HOUR_AGO = NOW - ONE_MINUTE * 60

      await redis.zAdd(ticketStoreService.getEventListKey(), [{ value: testEventId.toString(), score: ONE_HOUR_AGO }])

      const WAITING = ticketStoreService.getWaitingKeyByEventId(testEventId)
      await addUserIntoQueue(WAITING, 1, ONE_HOUR_AGO)
      await addUserIntoQueue(WAITING, 2, ONE_HOUR_AGO)
      await addUserIntoQueue(WAITING, 3, ONE_HOUR_AGO)

      const RUNNING = ticketStoreService.getRunningKeyByEventId(testEventId)
      await addUserIntoQueue(RUNNING, 4, ONE_HOUR_AGO)
      await addUserIntoQueue(RUNNING, 5, ONE_HOUR_AGO)
    }

    it('should remove expired queue', async () => {
      await setup1hoursAgo()
      expect(await ticketStoreService.getOffsetFromEventList(testEventId)).to.equal(0)

      await jobService.removeExpiredEvent()
      expect(await ticketStoreService.getOffsetFromEventList(testEventId)).to.equal(null)
    })

    it('should remove all waiting/running items when remove expired queue', async () => {
      await setup1hoursAgo()

      expect(await ticketStoreService.getLengthOfWaiting(testEventId)).to.equal(3)
      expect(await ticketStoreService.getLengthOfRunning(testEventId)).to.equal(2)

      await jobService.removeExpiredEvent()

      expect(await ticketStoreService.getLengthOfWaiting(testEventId)).to.equal(0)
      expect(await ticketStoreService.getLengthOfRunning(testEventId)).to.equal(0)
    })
  })
})
