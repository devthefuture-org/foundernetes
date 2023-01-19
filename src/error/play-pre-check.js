const FoundernetesPlayCheckError = require("./play-check")

module.exports = class FoundernetesPlayPreCheckError extends (
  FoundernetesPlayCheckError
) {
  constructor(msg = "FoundernetesPlayPreCheckError") {
    super(msg)
  }
}
