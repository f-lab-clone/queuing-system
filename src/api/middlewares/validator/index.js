const validator = require('express-validator')

const { sendResponse, CustomResponse } = require('../response')

const resolveValidation = (req) => {
  const errors = validator.validationResult(req)
  return errors.isEmpty()
    ? null
    : CustomResponse(422, '올바른 요청 형식이 아닙니다', errors.array())
}

const resolveValidationAndResonse =
  (customResponse) => async (req, res, next) => {
    const result = resolveValidation(req)
    if (!result) return next()
    if (customResponse) await customResponse(req)
    return sendResponse(res)(result)
  }

const mw = (validators) => {
  return [...validators, resolveValidationAndResonse()]
}

module.exports = {
  ...validator,
  resolveValidation,
  resolveValidationAndResonse,
  mw,
}
