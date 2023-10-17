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
      it('307 redirect를 리턴한다', async () => {})
      it('{eventId, userId, is_waiting, timestamp, offset, committedOffset, lastOffset}을 반환한다', async () => {})
    })
  })

  describe('GET /ticket/{event_id}/{user_id} 은', () => {
    describe('성공시', () => {
      it('is_waiting == false, 200 OK를 리턴한다', async () => {})
      it('is_waiting == true, 307 redirect를 리턴한다', async () => {})
      it('{eventId, userId, is_waiting, timestamp, offset, committedOffset, lastOffset}을 반환한다', async () => {})
    })
    describe('실패시', () => {
      it('대기열 티켓이 없을 경우 404 Not Found를 리턴한다', async () => {})
    })
  })
})
