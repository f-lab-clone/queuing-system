const logger = $require('loaders/logger')

module.exports = class TicketStore {
  constructor(ticketStoreService, { movePerInvetal, expiredSec }) {
    if (movePerInvetal < 1)
      throw new Error('movePerInvetal must be greater than 0')
    if (expiredSec < 1) throw new Error('expiredSec must be greater than 0')

    this.ticketStoreService = ticketStoreService
    this.movePerInvetal = movePerInvetal
    this.expiredSec = expiredSec
  }

  async getEventList() {
    const results = await this.ticketStoreService.getEventList()
    return results.map((e) => ({
      eventId: Number(e.value),
      timestamp: e.score,
    }))
  }

  async moveEventInToRunning(eventId) {
    const tickets = await this.ticketStoreService.shiftFromWaiting(
      eventId,
      this.movePerInvetal,
    )
    logger.info(
      `move Event InTo Running eventId: ${eventId} ${JSON.stringify(
        tickets.map((e) => e.eventId),
      )}`,
    )
    if (tickets.length === 0) return

    await this.ticketStoreService.pushIntoRunning(
      eventId,
      tickets.map((e) => e.eventId),
    )
  }

  async removeExpiredTicket(eventId) {
    const expriedTime = new Date().valueOf() - 1000 * this.expiredSec
    const waiting_count =
      await this.ticketStoreService.removeWaitingByTimestamp(
        eventId,
        0,
        expriedTime,
      )
    const running_count =
      await this.ticketStoreService.removeRunningByTimestamp(
        eventId,
        0,
        expriedTime,
      )

    logger.info(
      `remove Expired Ticket eventId: ${eventId} (Waitting = ${waiting_count}, Running = ${running_count})`,
    )
  }

  async removeExpiredEvent() {
    const expriedTime = new Date().valueOf() - 1000 * this.expiredSec * 3

    const events = await this.ticketStoreService.getEventIdByTimestamp(
      0,
      expriedTime,
    )

    logger.info(`remove Expired Event: ${JSON.stringify(events)}`)

    for (const eventId of events) {
      await this.ticketStoreService.removeAllOfWaiting(eventId)
      await this.ticketStoreService.removeAllOfRunning(eventId)
    }
    await this.ticketStoreService.removeEventIdByTimestamp(0, expriedTime)
  }
}
