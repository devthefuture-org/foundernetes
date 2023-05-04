const FoundernetesError = require("./foundernetes")

module.exports = class FoundernetesStopError extends FoundernetesError {
  constructor(...args) {
    super(...args)
    this.name = "AbortError"
  }
}
