const FoundernetesError = require("./foundernetes")

module.exports = class FoundernetesValidateVarsError extends FoundernetesError {
  constructor({ message, vars, validate }) {
    super(message)
    this.vars = vars
    this.validate = validate
  }

  output() {
    const { validate } = this
    const { schema, errors } = validate
    return [
      {
        ...(schema ? { schema } : {}),
        ...(errors ? { errors } : {}),
      },
      `${this.toString()} ${
        errors ? `${JSON.stringify(errors, null, 2)}` : ""
      }`,
    ]
  }
}
