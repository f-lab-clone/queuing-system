const getTimestamp = () => new Date().valueOf()

module.exports = class TicketStore {
  constructor(redis) {
    this.redis = redis
  }

  getEventListKey() {
    return 'event_list'
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
  async _removeByTimestamp(key, minScore, maxScore) {
    return this.redis.zRemRangeByScore(key, minScore, maxScore)
  }
  async _getByTimestamp(key, minScore, maxScore) {
    return this.redis.zRangeByScore(key, minScore, maxScore)
  }

  async getEventList() {
    return this.redis.zRangeWithScores(this.getEventListKey(), 0, -1)
  }

  async updateEventInList(eventId) {
    const results = await this._push(this.getEventListKey(), [eventId])
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
    const results = await this._shift(
      this.getWaitingKeyByEventId(eventId),
      userId.toString(),
    )
    return results.map((e) => ({
      timestamp: e.score,
      eventId: Number(e.value),
    }))
  }

  async getOffsetFromEventList(eventId) {
    return this._getOffset(this.getEventListKey(), eventId.toString())
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

  async removeWaitingByTimestamp(eventId, minTimestamp, maxTimestamp) {
    return this._removeByTimestamp(
      this.getWaitingKeyByEventId(eventId),
      minTimestamp,
      maxTimestamp,
    )
  }
  async removeRunningByTimestamp(eventId, minTimestamp, maxTimestamp) {
    return this._removeByTimestamp(
      this.getRunningKeyByEventId(eventId),
      minTimestamp,
      maxTimestamp,
    )
  }
  async removeAllOfWaiting(eventId) {
    return this.redis.del(this.getWaitingKeyByEventId(eventId))
  }
  async removeAllOfRunning(eventId) {
    return this.redis.del(this.getRunningKeyByEventId(eventId))
  }

  async removeEventIdByTimestamp(minTimestamp, maxTimestamp) {
    return this._removeByTimestamp(
      this.getEventListKey(),
      minTimestamp,
      maxTimestamp,
    )
  }
  async getEventIdByTimestamp(minTimestamp, maxTimestamp) {
    const results = await this._getByTimestamp(
      this.getEventListKey(),
      minTimestamp,
      maxTimestamp,
    )
    return results.map((e) => Number(e))
  }
}
