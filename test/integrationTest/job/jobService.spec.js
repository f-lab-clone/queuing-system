jest.setTimeout(30000)
const { GenericContainer } = require('testcontainers')

const chai = require('chai')
const expect = chai.expect

const ONE_MINUTE = 1000 * 60

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

  describe('Job.getEventList', () => {
    it('should return [] when no event in queue', async () => {
      const result = await jobService.getEventList()
      expect(result).to.deep.equal([])
    })
    it('should return [{eventId, timestamp}] when no event in queue', async () => {
      const { timestamp } = await ticketStoreService.updateEventInList(1)
      const result = await jobService.getEventList()
      expect(result).to.deep.equal([{ eventId: 1, timestamp }])
    })
  })

  describe('Job.moveEventInToRunning', () => {
    it('should move event from waiting to running', async () => {
      const eventId = 1
      await ticketStoreService.pushIntoWaiting(eventId, 1)
      await ticketStoreService.pushIntoWaiting(eventId, 2)
      await ticketStoreService.pushIntoWaiting(eventId, 3)

      await jobService.moveEventInToRunning(eventId)

      expect(await ticketStoreService.getLengthOfWaiting(eventId)).to.equal(1)
      expect(await ticketStoreService.getLengthOfRunning(eventId)).to.equal(2)
    })
  })

  describe('Job.removeExpiredTicket', () => {
    it('should remove expired ticket', async () => {
      const eventId = 100

      await redis.zAdd(ticketStoreService.getWaitingKeyByEventId(eventId), [
        { value: `1`, score: new Date().valueOf() - ONE_MINUTE * 4 },
        { value: `2`, score: new Date().valueOf() - ONE_MINUTE * 4 },
        { value: `3`, score: new Date().valueOf() - ONE_MINUTE * 1 },
      ])
      await redis.zAdd(ticketStoreService.getRunningKeyByEventId(eventId), [
        { value: `4`, score: new Date().valueOf() - ONE_MINUTE * 4 },
        { value: `5`, score: new Date().valueOf() - ONE_MINUTE * 4 },
      ])

      await jobService.removeExpiredTicket(eventId)
      expect(await ticketStoreService.getLengthOfWaiting(eventId)).to.equal(1)
      expect(await ticketStoreService.getLengthOfRunning(eventId)).to.equal(0)
    })
  })

  describe('Job.removeExpiredEvent', () => {
    const eventId = 1001
    async function setup1hoursAgo() {
      await ticketStoreService.updateEventInList(eventId)
      const ONE_HOUR_AGO = new Date().valueOf() - ONE_MINUTE * 60

      await redis.zAdd(ticketStoreService.getEventListKey(), [
        { value: eventId.toString(), score: ONE_HOUR_AGO },
      ])
      await redis.zAdd(ticketStoreService.getWaitingKeyByEventId(eventId), [
        { value: `1`, score: ONE_HOUR_AGO },
        { value: `2`, score: ONE_HOUR_AGO },
        { value: `3`, score: new Date().valueOf() - ONE_MINUTE * 1 },
      ])
      await redis.zAdd(ticketStoreService.getRunningKeyByEventId(eventId), [
        { value: `4`, score: ONE_HOUR_AGO },
        { value: `5`, score: ONE_HOUR_AGO },
      ])
    }
    it('should remove expired queue', async () => {
      await setup1hoursAgo()
      expect(await ticketStoreService.getOffsetFromEventList(eventId)).to.equal(
        0,
      )

      await jobService.removeExpiredEvent()
      expect(await ticketStoreService.getOffsetFromEventList(eventId)).to.equal(
        null,
      )
    })
    it('should remove all waiting/running items when remove expired queue', async () => {
      await setup1hoursAgo()

      expect(await ticketStoreService.getLengthOfWaiting(eventId)).to.equal(3)
      expect(await ticketStoreService.getLengthOfRunning(eventId)).to.equal(2)

      await jobService.removeExpiredEvent()

      expect(await ticketStoreService.getLengthOfWaiting(eventId)).to.equal(0)
      expect(await ticketStoreService.getLengthOfRunning(eventId)).to.equal(0)
    })
  })
})
