const FoundernetesError = require("./foundernetes")

module.exports = class FoundernetesPlayRunError extends FoundernetesError {
  constructor(msg = "FoundernetesPlayRunError") {
    super(msg)
  }
}
