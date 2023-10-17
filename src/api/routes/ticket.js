const router = require('express').Router();
const logger = $require('loaders/logger')
const redis = $require('loaders/redis')
const { CustomResponse, validator, container } = $require('api/middlewares')
const TicketStoreService = $require('services/ticketStore')
module.exports = app => {
  app.use('/ticket', router);


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
      await ticketStoreService.push(eventId, userId)
      return CustomResponse(201, `Created!`)
    }),
  )
};