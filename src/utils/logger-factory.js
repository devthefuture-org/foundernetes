const { Logger } = require("direct-logger")

module.exports = (opts = {}) => {
  const levels = opts.levels || [
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
  ]
  const logger = Logger({
    levels,
    formatter: "cli",
    streams: Logger.levels.map((_level, _i) => process.stderr),
    ...opts,
  })
  if (process.env.F10S_LOG_LEVEL) {
    const level = process.env.F10S_LOG_LEVEL
    if (!levels.includes(level)) {
      throw new Error(
        `unkown logLevel "${level}", expected one of: ${level.join(",")}`
      )
    }
    logger.setLevel(level)
  }

  const configureDebug = (debug) => {
    if (
      debug &&
      debug !== "0" &&
      debug !== "false" &&
      levels.indexOf("debug") < levels.indexOf(logger.level)
    ) {
      logger.setLevel("debug")
    }
  }

  configureDebug(process.env.F10S_DEBUG || process.env.DEBUG)

  logger.configureDebug = configureDebug

  return logger
}
