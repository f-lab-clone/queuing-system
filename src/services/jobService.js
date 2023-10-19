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

  async getTotalEvent() {
    const results = await this.ticketStoreService.getTotalEvent()
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
    const time3mAgo = new Date().valueOf() - ONE_MINUTE * this.expiredMinute
    await this.ticketStoreService.removeWaitingByScore(eventId, 0, time3mAgo)
    await this.ticketStoreService.removeRunningByScore(eventId, 0, time3mAgo)
  }
}
