const logger = $require('loaders/logger')

const generateWaitingKey = (eventId) => `waiting_${eventId}`
const generateRunningKey = (eventId) => `running_${eventId}`
const getTimestamp = () => new Date().valueOf()

module.exports = class TicketStore {
  constructor(redis) {
    this.redis = redis
  }

  async push(eventId, userId) {
    await this.redis.zAdd(generateWaitingKey(eventId), [
      {
        score: getTimestamp(),
        value: userId.toString(),
      },
    ])

    logger.info(
      `${eventId} totalCount: ${await this.redis.zCard(
        generateWaitingKey(eventId),
      )}`,
    )
  }
}
