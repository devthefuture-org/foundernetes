const FoundernetesError = require("./foundernetes")

module.exports = (logger, error) => {
  if (error instanceof FoundernetesError) {
    logger.error(...error.getErrorLoggerParams())
  } else {
    logger.error(error.toString())
  }
}
