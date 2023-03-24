const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const setIndentationContext = require("~/log/set-context-indentation")

const timeLogger = require("~/utils/time-logger")

const start = (definition) => {
  const { log = true, name } = definition
  const elapsed = timeLogger()
  const logPlayContext = { ...definition, elapsed }
  if (!log) {
    return logPlayContext
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
  return logPlayContext
}

const end = ({ log = true, name, elapsed }) => {
  if (!log) {
    return
  }
  const logger = ctx.require("logger")
  logger.setPrefix("")
  logger.info(`⏹  played: ${name}`)
  elapsed.end({
    label: "🏁 play runned in",
    logger: ctx.require("logger"),
    logLevel: "trace",
  })
}

module.exports = {
  start,
  end,
}
