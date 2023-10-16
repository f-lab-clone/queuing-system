const { Router } = require('express')
const logger = $require('loaders/logger')
const { CustomResponse, validator, container } = $require('api/middlewares')

module.exports = () => {
  const router = Router()

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

  return router
}
