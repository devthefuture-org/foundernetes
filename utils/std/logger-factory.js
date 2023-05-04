const { Logger, fileWriteStreamSync } = require("direct-logger")
const removeAllAnsiColors = require("@foundernetes/std/remove-all-ansi-colors")

module.exports = (opts = {}) => {
  const { logFile, logLevel } = opts
  const { logFilePlain } = opts

  const createLoggerStream = () => {
    const callbacks = []
    callbacks.push((msg) => process.stderr.write(msg))
    if (logFile) {
      const stream = fileWriteStreamSync(logFile)
      callbacks.push((msg) => stream.write(msg))
    }
    if (logFilePlain) {
      const stream = fileWriteStreamSync(logFilePlain)
      callbacks.push((msg) => {
        msg = removeAllAnsiColors(msg)
        stream.write(msg)
      })
    }
    return (msg, _enc, done) => {
      for (const callback of callbacks) {
        callback(msg)
      }
      if (done) {
        done()
      }
    }
  }

  const logStream = createLoggerStream()

  const logger = Logger({
    formatter: "cli",
    level: logLevel,
    streams: Logger.levels.map((_level, _i) => logStream),
    ...opts,
    formatterOptions: {
      displayLevel: false,
      // displayDate: true,
      displayDuration: true,
      ...(opts.formatterOptions || {}),
    },
  })

  const configureDebug = (debug) => {
    if (debug && debug !== "0" && debug !== "false") {
      logger.minLevel("debug")
    }
  }

  configureDebug(process.env.F10S_DEBUG || process.env.DEBUG)

  logger.configureDebug = configureDebug

  return logger
}
