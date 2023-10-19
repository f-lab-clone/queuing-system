module.exports = class TicketStore {
  constructor(ticketStoreService, movePerInvetal) {
    this.ticketStoreService = ticketStoreService
    this.movePerInvetal = movePerInvetal
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
}
