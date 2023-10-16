const config = $require('config')
const { CustomResponse, sendResponse } = require('./response')

module.exports = (service) => async (req, res) => {
  const response = sendResponse(res)
  try {
    const result = await service(req)
    response(
      result ||
        CustomResponse(500, '서비스 장애입니다', {
          errorMessage: '반환값이 명시되지 않았습니다.',
        }),
    )
  } catch (e) {
    if (config.NODE_ENV !== 'test') console.error(e)

    if (e.status !== undefined) {
      const httpCode = e.httpCode || 500
      return res.status(httpCode).json(e)
    }
    response(
      CustomResponse(500, '서비스 장애입니다', {
        errorMessage: e.message || '',
      }),
    )
  }
}
