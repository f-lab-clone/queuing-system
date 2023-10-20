jest.setTimeout(30000)

const redis = require('redis')
const { GenericContainer } = require('testcontainers')

describe('Redis', () => {
  let container
  let redisClient

  beforeAll(async () => {
    container = await new GenericContainer('redis').withExposedPorts(6379).start()

    const URL = `redis://${container.getHost()}:${container.getMappedPort(6379)}`
    redisClient = redis.createClient({ url: URL })
    await redisClient.connect()
  })

  afterAll(async () => {
    await redisClient.disconnect()
    await container.stop()
  })

  it('works', async () => {
    await redisClient.set('key', 'val')
    expect(await redisClient.get('key')).toBe('val')
  })
})
