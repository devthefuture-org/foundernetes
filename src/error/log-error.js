const ctx = require("~/ctx")

const FoundernetesError = require("./foundernetes")

module.exports = (error, logger) => {
  if (!logger) {
    logger = ctx.get("logger")
  }
  if (error instanceof FoundernetesError) {
    logger.error(...error.getErrorLoggerParams())
  } else {
    logger.error(error)
  }
}
