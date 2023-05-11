const isAbortError = require("@foundernetes/std/is-abort-error")
const ctx = require("@foundernetes/ctx")

const FoundernetesError = require("./foundernetes")

module.exports = (error, logger) => {
  if (isAbortError(error)) {
    return
  }
  if (!logger) {
    logger = ctx.get("logger")
  }
  if (error instanceof FoundernetesError) {
    logger.error(...error.getErrorLoggerParams())
  } else {
    logger.error(error)
  }
}
