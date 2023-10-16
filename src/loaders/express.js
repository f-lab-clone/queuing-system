const morgan = require('morgan')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')
const routes = $require('api/index.js')
const config = $require('config')
const { sendResponse, CustomResponse } = $require('api/middlewares')

module.exports = (app) => {
  app.use(helmet())
  app.use(cors())
  app.use(morgan(config.NODE_ENV == 'production' ? 'combined' : 'dev'))

  app.use(
    bodyParser.urlencoded({
      extended: false,
    }),
  )
  app.use(bodyParser.json())
  app.use(routes())

  app.use((req, res, next) =>
    sendResponse(res)(
      CustomResponse(404, '알 수 없는 요청입니다', { url: req.originalUrl }),
    ),
  )

  app.use((err, req, res, next) => {
    console.log(err)
    return sendResponse(res)(
      CustomResponse(500, '서비스 장애입니다', {
        errorMessage: err.message || '',
      }),
    )
  })
}
