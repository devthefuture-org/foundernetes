const ctx = require("~/ctx")

const isAbortError = require("~/utils/is-abort-error")

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
