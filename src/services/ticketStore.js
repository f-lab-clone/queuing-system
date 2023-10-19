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

  async _push(key, values) {
    const data = values.reduce((acc, value) => {
      acc.push({
        score: getTimestamp(),
        value: value.toString(),
      })
      return acc
    }, [])

    await this.redis.zAdd(key, data)

    return data.map((e) => ({ timestamp: e.score, eventId: Number(e.value) }))
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

  async getTotalEvent() {
    return this.redis.zRangeWithScores(this.getQueueKey(), 0, -1)
  }

  async updateQueue(eventId) {
    const results = await this._push(this.getQueueKey(), [eventId])
    return results[0]
  }
  async pushIntoWaiting(eventId, userId) {
    const data = userId instanceof Array ? userId : [userId]
    const results = await this._push(this.getWaitingKeyByEventId(eventId), data)
    return {
      timestamp: results[0].timestamp,
      isWaiting: true,
      eventId,
      userId,
    }
  }
  async pushIntoRunning(eventId, userId) {
    const data = userId instanceof Array ? userId : [userId]
    const results = await this._push(this.getRunningKeyByEventId(eventId), data)
    return {
      timestamp: results[0].timestamp,
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
}
