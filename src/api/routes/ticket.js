const router = require('express').Router()
const logger = $require('loaders/logger')
const redis = $require('loaders/redis')
const { CustomResponse, validator, container } = $require('api/middlewares')
const TicketStoreService = $require('services/ticketStore')
module.exports = (app) => {
  app.use('/ticket', router)

  router.post(
    '/',
    validator.mw([
      validator.body('eventId').isInt(),
      validator.body('userId').isInt(),
    ]),
    container(async (req) => {
      logger.debug('Calling POST /ticket with body: %o', req.body)
      const { eventId, userId } = req.body

      const ticketStoreService = new TicketStoreService(redis)
      const result = await ticketStoreService.push(eventId, userId)
      result.offset = await ticketStoreService.getOffset(eventId, userId)
      return CustomResponse(201, `Created!`, result)
    }),
  )

  router.get(
    '/:eventId/:userId',
    validator.mw([
      validator.param('eventId').isInt(),
      validator.param('userId').isInt(),
    ]),
    container(async (req) => {
      logger.debug('Calling GET /ticket with params: %o', req.params)
      const { eventId, userId } = req.params

      const ticketStoreService = new TicketStoreService(redis)
      const offset = await ticketStoreService.getOffset(eventId, userId)
      if (!offset) return CustomResponse(404, `Ticket Not Found!`)

      return CustomResponse(200, `Success!`, {
        eventId,
        userId,
        isWaiting: true,
        offset,
      })
    }),
  )
}
