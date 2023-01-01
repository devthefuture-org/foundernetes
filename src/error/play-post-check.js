const FoundernetesError = require("./foundernetes")

module.exports = class FoundernetesPlayPostCheckError extends (
  FoundernetesError
) {
  constructor(msg = "FoundernetesPlayPostCheckError") {
    super(msg)
  }
}
