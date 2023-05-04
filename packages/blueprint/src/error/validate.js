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
      `${this.toString()} ${
        errors ? `${JSON.stringify(errors, null, 2)}` : ""
      }`,
      {
        ...(schema ? { schema } : {}),
        ...(errors ? { errors } : {}),
      },
    ]
  }
}
