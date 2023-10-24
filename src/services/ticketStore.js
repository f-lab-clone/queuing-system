const getTimestamp = () => new Date().valueOf()

module.exports = class TicketStore {
  constructor(redis) {
    this.redis = redis
  }

  getQueueKey() {
    return 'queue'
  }

  getWaitingKeyByEventId(eventId) {
    return `waiting_${eventId}`
  }

  getRunningKeyByEventId(eventId) {
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

  async updateQueue(eventId) {
    await this._push(this.getQueueKey(), eventId.toString())
  }
  async pushIntoWaiting(eventId, userId) {
    const result = await this._push(
      this.getWaitingKeyByEventId(eventId),
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
      this.getRunningKeyByEventId(eventId),
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
    return this._shift(this.getWaitingKeyByEventId(eventId), userId.toString())
  }
  async shiftFromRunning(eventId, userId) {
    return this._shift(this.getRunningKeyByEventId(eventId), userId.toString())
  }

  async getOffsetFromWaiting(eventId, userId) {
    return this._getOffset(
      this.getWaitingKeyByEventId(eventId),
      userId.toString(),
    )
  }
  async getOffsetFromRunning(eventId, userId) {
    return this._getOffset(
      this.getRunningKeyByEventId(eventId),
      userId.toString(),
    )
  }
  async getLengthOfWaiting(eventId) {
    return await this._length(this.getWaitingKeyByEventId(eventId))
  }
  async getLengthOfRunning(eventId) {
    return await this._length(this.getRunningKeyByEventId(eventId))
  }

  async removeticketFromWaiting(eventId, userId) {
    return this.redis.zRem(this.getWaitingKeyByEventId(eventId), userId)
  }
  async removeTicketFromRunning(eventId, userId) {
    return this.redis.zRem(this.getRunningKeyByEventId(eventId), userId)
  }
}
