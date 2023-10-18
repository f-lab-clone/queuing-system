const logger = $require('loaders/logger')

const generateWaitingKey = (eventId) => `waiting_${eventId}`
const generateRunningKey = (eventId) => `running_${eventId}`
const getTimestamp = () => new Date().valueOf()

module.exports = class TicketStore {
  constructor(redis) {
    this.redis = redis
  }

  async push(eventId, userId) {
    const score = getTimestamp()
    await this.redis.zAdd(generateWaitingKey(eventId), [
      {
        score,
        value: userId.toString(),
      },
    ])

    return {
      eventId,
      userId,
      timestamp: score,
      isWaiting: true,
    }
  }

  async getOffset(eventId, uesrId) {
    return await this.redis.zRank(
      generateWaitingKey(eventId),
      uesrId.toString(),
    )
  }
}
