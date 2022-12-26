const ctx = require("~/ctx")

const getLoggerOptions = require("./get-logger-options")

module.exports = ({ name }) => {
  const logger = ctx.replace("logger", (log) =>
    log.child(
      {
        play: name,
      },
      getLoggerOptions()
    )
  )
  logger.info(`⏬ loading: ${name}`)
  logger.setPrefix("├─── ")
}
