jest.setTimeout(30000)

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

    server = require('../../../src/api')
  })
  describe('GET / 는', () => {
    describe('성공시', () => {
      it('200 OK를 리턴한다', async () => {
        const res = await chai.request(server).get('/').send()
        expect(res).to.have.status(200)
        expect(res.body.status).to.deep.equal(true)
        expect(res.body.message).to.deep.equal('OK')
      })
    })
  })
  describe('GET /health 는', () => {
    describe('성공시', () => {
      it('200 OK를 리턴한다', async () => {
        const res = await chai.request(server).get('/').send()
        expect(res).to.have.status(200)
        expect(res.body.status).to.deep.equal(true)
        expect(res.body.message).to.deep.equal('OK')
      })
    })
  })
})
