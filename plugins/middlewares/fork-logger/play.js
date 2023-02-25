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

  logger.info(`▶️  playing: ${name}`)
  const iteratorSerie = ctx.get("iteratorSerie")
  if (iteratorSerie) {
    logger.setPrefix("├─── ")
  } else {
    logger.setPrefix("──── ")
  }
}
