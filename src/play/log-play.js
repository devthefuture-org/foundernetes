const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const addIndentation = require("~/log/add-indentation")

const start = ({ logEnabled, name }) => {
  if (logEnabled) {
    return
  }
  addIndentation()
  const logger = ctx.replace("logger", (log) =>
    log.child(
      {
        play: name,
      },
      getContextLoggerOptions()
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

const end = ({ logEnabled, name }) => {
  if (logEnabled) {
    return
  }
  const logger = ctx.require("logger")
  logger.info(`⏹️ played: ${name}`)
}

module.exports = {
  start,
  end,
}
