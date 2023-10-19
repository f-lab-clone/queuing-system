const ONE_MINUTE = 1000 * 60

module.exports = class TicketStore {
  constructor(ticketStoreService, { movePerInvetal, expiredMinute }) {
    if (movePerInvetal < 1)
      throw new Error('movePerInvetal must be greater than 0')
    if (expiredMinute < 1)
      throw new Error('expiredMinute must be greater than 0')

    this.ticketStoreService = ticketStoreService
    this.movePerInvetal = movePerInvetal
    this.expiredMinute = expiredMinute
  }

  async getEventList() {
    const results = await this.ticketStoreService.getEventList()
    return results.map((e) => ({
      event_id: Number(e.value),
      timestamp: e.score,
    }))
  }

  async moveEventToRunning(eventId) {
    const tickets = await this.ticketStoreService.shiftFromWaiting(
      eventId,
      this.movePerInvetal,
    )
    await this.ticketStoreService.pushIntoRunning(
      eventId,
      tickets.map((e) => e.value),
    )
  }

  async removeExpiredTicket(eventId) {
    const expriedTime = new Date().valueOf() - ONE_MINUTE * this.expiredMinute
    await this.ticketStoreService.removeWaitingByTimestamp(
      eventId,
      0,
      expriedTime,
    )
    await this.ticketStoreService.removeRunningByTimestamp(
      eventId,
      0,
      expriedTime,
    )
  }

  async removeExpiredQueue() {
    const expriedTime =
      new Date().valueOf() - ONE_MINUTE * this.expiredMinute * 3

    const events = await this.ticketStoreService.getEventIdByTimestamp(
      0,
      expriedTime,
    )

    for (const eventId of events) {
      await this.ticketStoreService.removeAllOfWaiting(eventId)
      await this.ticketStoreService.removeAllOfRunning(eventId)
    }
    await this.ticketStoreService.removeEventIdByTimestamp(0, expriedTime)
  }
}
