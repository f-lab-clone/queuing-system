const { Router } = require('express')
const logger = $require('loaders/logger')
const redis = $require('loaders/redis')
const { CustomResponse, validator, container } = $require('api/middlewares')
const TicketStoreService = $require('services/ticketStore')

module.exports = () => {
  const router = Router()
  const ticketStoreService = new TicketStoreService(redis)

  router.get(
    '/',
    container(async (req) => {
      return CustomResponse(200, `Hello World`)
    }),
  )

  router.get(
    '/health',
    container(async (req) => {
      return CustomResponse(200, `Hello World`)
    }),
  )

  router.post(
    '/ticket',
    validator.mw([
      validator.body('eventId').isInt(),
      validator.body('userId').isInt(),
    ]),
    container(async (req) => {
      logger.debug('Calling POST /ticket with body: %o', req.body)
      const { eventId, userId } = req.body

      await ticketStoreService.push(eventId, userId)
      return CustomResponse(201, `Created!`)
    }),
  )

  return router
}
