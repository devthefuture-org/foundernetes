const FoundernetesValidateError = require("./validate")

module.exports = class FoundernetesValidateDataError extends (
  FoundernetesValidateError
) {
  constructor({ vars, validate }) {
    super({
      message: "data validation error",
      vars,
      validate,
    })
  }
}
