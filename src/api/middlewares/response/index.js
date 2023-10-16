const CustomResponse = (
  httpCode = 500,
  message = '서버 내부에 장애가 발생했습니다.',
  data = null,
) => {
  return {
    status: httpCode < 300 && httpCode >= 200,
    httpCode,
    message,
    data,
  }
}




const sendResponse =
  (res) =>
  (result = {}) =>
    res.status(result.httpCode || 500).send({
      status: result.status || false,
      message: result.message || '서버 내부에 장애가 발생했습니다.',
      data: result.data,
    })

module.exports = {
  sendResponse,
  CustomResponse,
}
