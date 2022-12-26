const ctx = require("~/ctx")

const getLoggerOptions = require("./get-logger-options")

module.exports = ({ index }) => {
  const logger = ctx.replace("logger", (log) =>
    log.child(
      {
        index,
      },
      getLoggerOptions()
    )
  )
  logger.info(`↪️  iterating: ${index}`)
}
