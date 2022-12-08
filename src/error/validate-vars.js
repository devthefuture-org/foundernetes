const FoundernetesValidateError = require("./validate")

module.exports = class FoundernetesValidateVarsError extends (
  FoundernetesValidateError
) {
  constructor({ vars, validate }) {
    super({
      message: "vars validation error",
      vars,
      validate,
    })
  }
}
