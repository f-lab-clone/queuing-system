const chai = require('chai')
const chaiHttp = require('chai-http')
const { GenericContainer } = require('testcontainers')
const expect = chai.expect
chai.use(chaiHttp)

describe('Health', () => {
  let server = null
  beforeAll(async () => {
    container = await new GenericContainer('redis')
      .withExposedPorts(6379)
      .start()
    process.env = {
      NODE_ENV: 'test',
      REDIS_HOST: container.getHost(),
      REDIS_PORT: container.getMappedPort(6379),
    }

    server = require('../../src/api')
  })

  describe('POST /ticket 은', () => {
    describe('성공시', () => {
      it('201을 리턴한다', async () => {
        const res = await chai.request(server).post('/ticket').send({
          eventId: 1,
          userId: 100,
        })
        expect(res).to.have.status(201)
        expect(res.body.status).to.deep.equal(true)
      })
      it('{eventId, userId, isWaiting, timestamp, offset}을 반환한다', async () => {
        const res = await chai.request(server).post('/ticket').send({
          eventId: 1,
          userId: 100,
        })
        expect(res.body.data).to.be.an('object')
        expect(res.body.data).to.have.property('eventId')
        expect(res.body.data).to.have.property('userId')
        expect(res.body.data).to.have.property('isWaiting')
        expect(res.body.data).to.have.property('offset')
      })
      it('대기열은 정확한 Offset을 반환한다', async () => {
        for (let i = 1; i < 10; i++) {
          const res = await chai.request(server).post('/ticket').send({
            eventId: 1,
            userId: i,
          })
          expect(res.body.data.offset).to.deep.equal(i)
        }
      })
    })
  })

  describe('GET /ticket/{event_id}/{user_id} 은', () => {
    describe('성공시', () => {
      it('200을 리턴한다', async () => {
        await chai.request(server).post('/ticket').send({
          eventId: 1,
          userId: 100,
        })

        const res = await chai.request(server).get(`/ticket/1/100`)
        expect(res).to.have.status(200)
        expect(res.body.status).to.deep.equal(true)
      })
      it('{eventId, userId, isWaiting, timestamp, offset}을 반환한다', async () => {
        await chai.request(server).post('/ticket').send({
          eventId: 1,
          userId: 100,
        })

        const res = await chai.request(server).get(`/ticket/1/100`)
        expect(res.body.data).to.be.an('object')
        expect(res.body.data).to.have.property('eventId')
        expect(res.body.data).to.have.property('userId')
        expect(res.body.data).to.have.property('isWaiting')
        expect(res.body.data).to.have.property('offset')
      })
    })
    describe('실패시', () => {
      it('대기열 티켓이 없을 경우 404 Not Found를 리턴한다', async () => {
        const res = await chai.request(server).get(`/ticket/1/1`)
        expect(res).to.have.status(404)
        expect(res.body.status).to.deep.equal(false)
      })
    })
  })
})
