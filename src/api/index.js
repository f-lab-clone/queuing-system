const { Router } = require('express')
const { CustomResponse, container } = $require('api/middlewares')

module.exports = (app) => {
  const router = Router()

  router.get(
    '/',
    container(async (req) => {
      return CustomResponse(200, `OK`)
    }),
  )

  router.get(
    '/health',
    container(async (req) => {
      return CustomResponse(200, `OK`)
    }),
  )

  require('./routes/ticket')(router)

  return router
}
