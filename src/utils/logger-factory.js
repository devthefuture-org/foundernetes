const fs = require("fs")
const { Logger } = require("direct-logger")
const streamCombiner = require("~/utils/stream-combiner")
const streamTransformer = require("~/utils/stream-transformer")
const removeAllAnsiColors = require("~/utils/remove-all-ansi-colors")

module.exports = (opts = {}) => {
  const { logFile, logLevel } = opts
  const { logFilePlain } = opts

  const createLoggerStream = () => {
    const streams = []
    streams.push(process.stderr)
    if (logFile) {
      const fileStream = fs.createWriteStream(logFile)
      streams.push(fileStream)
    }
    if (logFilePlain) {
      const fileStream = fs.createWriteStream(logFilePlain)
      const stream = streamTransformer(fileStream, (data) =>
        removeAllAnsiColors(data.toString())
      )
      streams.push(stream)
    }
    return streamCombiner(...streams)
  }

  const logger = Logger({
    formatter: "cli",
    formatterOptions: {
      displayLevel: false,
    },
    level: logLevel,
    streams: Logger.levels.map((_level, _i) => createLoggerStream()),
    ...opts,
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
