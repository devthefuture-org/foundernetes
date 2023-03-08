const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const setIndentationContext = require("~/log/set-context-indentation")

const start = ({ log = true, name }) => {
  if (!log) {
    return
  }
  setIndentationContext.incr()
  const logger = ctx.replace("logger", (l) =>
    l.child(
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

const end = ({ log = true, name }) => {
  if (!log) {
    return
  }
  const logger = ctx.require("logger")
  logger.setPrefix("")
  logger.info(`⏹  played: ${name}`)
}

module.exports = {
  start,
  end,
}
