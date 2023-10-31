jest.setTimeout(30000)

const chai = require('chai')
const chaiHttp = require('chai-http')
const { GenericContainer } = require('testcontainers')
const expect = chai.expect
chai.use(chaiHttp)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

describe('Ticket', () => {
  let container = null
  let server = null
  let redis = null
  let ticketStoreService = null

  const testEventId = 1
  const testUserId = 1

  beforeAll(async () => {
    container = await new GenericContainer('redis').withExposedPorts(6379).start()
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
  describe('POST /ticket 은', () => {
    describe('성공시', () => {
      it('전체 Queue를 관리하는 Sorted Set에 EventId를 추가한다', async () => {
        for (let testEventId = 1; testEventId < 10; testEventId++) {
          await chai.request(server).post('/ticket').send({
            eventId: testEventId,
            userId: testUserId,
          })
          const res = await redis.zRank(ticketStoreService.getEventListKey(), testEventId.toString())
          expect(res).to.deep.equal(testEventId - 1)
        }
      })
      it('전체 Queue를 관리하는 Sorted Set에 항상 최신값이 갱신되어야 한다', async () => {
        const isRange = (score) => score <= new Date().valueOf() + 100 && score >= new Date().valueOf() - 100

        await chai.request(server).post('/ticket').send({
          eventId: 1,
          userId: 1,
        })
        const score1 = await redis.zScore(ticketStoreService.getEventListKey(), '1')

        expect(isRange(score1)).to.deep.equal(true)
        await sleep(2000)
        expect(isRange(score1)).to.deep.equal(false)

        await chai.request(server).post('/ticket').send({
          eventId: 1,
          userId: 1,
        })
        const score2 = await redis.zScore(ticketStoreService.getEventListKey(), '1')
        expect(isRange(score2)).to.deep.equal(true)
      })

      it('201을 리턴한다', async () => {
        const res = await chai.request(server).post('/ticket').send({
          eventId: testEventId,
          userId: testUserId,
        })
        expect(res).to.have.status(201)
        expect(res.body.status).to.deep.equal(true)
      })
      it('{eventId, userId, isWaiting, timestamp, offset}을 반환한다', async () => {
        const res = await chai.request(server).post('/ticket').send({
          eventId: testEventId,
          userId: testUserId,
        })
        expect(res.body.data).to.be.an('object')
        expect(res.body.data).to.have.property('eventId')
        expect(res.body.data).to.have.property('userId')
        expect(res.body.data).to.have.property('isWaiting')
        expect(res.body.data).to.have.property('offset')
      })
      it('대기열은 정확한 Offset을 반환한다', async () => {
        for (let testUserId = 1; testUserId < 10; testUserId++) {
          const res = await chai.request(server).post('/ticket').send({
            eventId: testEventId,
            userId: testUserId,
          })
          expect(res.body.data.offset).to.deep.equal(testUserId - 1)
        }
      })
    })
  })

  describe('GET /ticket/{eventId}/{userId} 은', () => {
    describe('성공시', () => {
      it('200을 리턴한다', async () => {
        await chai.request(server).post('/ticket').send({
          eventId: testEventId,
          userId: testUserId,
        })

        const res = await chai.request(server).get(`/ticket/${testEventId}/${testUserId}`)
        expect(res).to.have.status(200)
        expect(res.body.status).to.deep.equal(true)
      })

      it('{eventId, userId, isWaiting, timestamp, offset}을 반환한다', async () => {
        await chai.request(server).post('/ticket').send({
          eventId: testEventId,
          userId: testUserId,
        })

        const res = await chai.request(server).get(`/ticket/${testEventId}/${testUserId}`)
        expect(res.body.data).to.be.an('object')
        expect(res.body.data).to.have.property('eventId')
        expect(res.body.data).to.have.property('userId')
        expect(res.body.data).to.have.property('isWaiting')
        expect(res.body.data).to.have.property('offset')
      })

      it('Running Queue Ticket은 IsWaiting = True를 반환한다.', async () => {
        await ticketStoreService.pushIntoRunning(1, 100)
        await ticketStoreService.pushIntoWaiting(2, 100)
        const res1 = await chai.request(server).get(`/ticket/1/100`)
        expect(res1.body.data.isWaiting).to.deep.equal(false)
        expect(res1.body.data.offset).to.deep.equal(0)

        const res2 = await chai.request(server).get(`/ticket/2/100`)
        expect(res2.body.data.isWaiting).to.deep.equal(true)
        expect(res2.body.data.offset).to.deep.equal(0)
      })
    })
    describe('실패시', () => {
      it('대기열 티켓이 없을 경우 404 Not Found를 리턴한다', async () => {
        const res = await chai.request(server).get(`/ticket/${testEventId}/${testUserId}`)
        expect(res).to.have.status(404)
        expect(res.body.status).to.deep.equal(false)
      })
    })
  })

  describe('DELETE /ticket/running/{eventId}/{userId} 은', () => {
    describe('삭제 성공시', () => {
      it('200을 리턴한다', async () => {
        await ticketStoreService.pushIntoRunning(testEventId, testUserId)

        const res = await chai.request(server).del(`/ticket/running/${testEventId}/${testUserId}`)
        expect(res).to.have.status(200)
        expect(res.body.status).to.deep.equal(true)
      })
    })
    describe('실패시', () => {
      it('Running 티켓이 없을 경우 404 Not Found를 리턴한다', async () => {
        const res = await chai.request(server).del(`/ticket/${testEventId}/${testUserId}`)
        expect(res).to.have.status(404)
        expect(res.body.status).to.deep.equal(false)
      })
      it('Waiting 티켓이 존재해도, 입장 티켓이 없을 경우 404 Not Found를 리턴한다', async () => {
        await chai.request(server).post('/ticket').send({
          eventId: testEventId,
          userId: testUserId,
        })

        const res = await chai.request(server).del(`/ticket/running/${testEventId}/${testUserId}`)
        expect(res).to.have.status(404)
        expect(res.body.status).to.deep.equal(false)
      })
    })
  })
})
