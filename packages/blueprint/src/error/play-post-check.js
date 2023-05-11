const FoundernetesPlayCheckError = require("./play-check")

module.exports = class FoundernetesPlayPostCheckError extends (
  FoundernetesPlayCheckError
) {
  constructor(msg = "FoundernetesPlayPostCheckError") {
    super(msg)
  }
}
