module.exports = class TicketStore {
  constructor(ticketStoreService) {
    this.ticketStoreService = ticketStoreService
  }

  async getTotalEvent() {
    const results = await this.ticketStoreService.getTotalEvent()
    return results.map((e) => ({
      event_id: Number(e.value),
      timestamp: e.score,
    }))
  }
}
