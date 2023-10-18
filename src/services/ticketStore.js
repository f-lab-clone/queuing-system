const logger = $require('loaders/logger')

const getTimestamp = () => new Date().valueOf()

module.exports = class TicketStore {
  constructor(redis) {
    this.redis = redis
  }

  generateWaitingKey(eventId) {
    return `waiting_${eventId}`
  }

  generateRunningKey(eventId) {
    return `running_${eventId}`
  }

  async _push(key, value) {
    const score = getTimestamp()
    await this.redis.zAdd(key, [
      {
        score,
        value,
      },
    ])

    return {
      timestamp: score,
    }
  }
  async _shift(key, count) {
    const tickets = await this.redis.zRangeWithScores(key, 0, count - 1)
    await this.redis.zRemRangeByRank(key, 0, count - 1)
    return tickets
  }
  async _getOffset(key, value) {
    return this.redis.zRank(key, value)
  }
  async _length(key) {
    return this.redis.zCard(key)
  }

  async pushIntoWaiting(eventId, userId) {
    const result = await this._push(
      this.generateWaitingKey(eventId),
      userId.toString(),
    )
    return {
      ...result,
      isWaiting: true,
      eventId,
      userId,
    }
  }
  async pushIntoRunning(eventId, userId) {
    const result = await this._push(
      this.generateRunningKey(eventId),
      userId.toString(),
    )
    return {
      ...result,
      isWaiting: false,
      eventId,
      userId,
    }
  }
  async shiftFromWaiting(eventId, userId) {
    return this._shift(this.generateWaitingKey(eventId), userId.toString())
  }
  async shiftFromRunning(eventId, userId) {
    return this._shift(this.generateRunningKey(eventId), userId.toString())
  }

  async getOffsetFromWaiting(eventId, userId) {
    return this._getOffset(this.generateWaitingKey(eventId), userId.toString())
  }
  async getOffsetFromRunning(eventId, userId) {
    return this._getOffset(this.generateRunningKey(eventId), userId.toString())
  }
  async getLengthOfWaiting(eventId) {
    return await this._length(this.generateWaitingKey(eventId))
  }
  async getLengthOfRunning(eventId) {
    return await this._length(this.generateRunningKey(eventId))
  }
}
