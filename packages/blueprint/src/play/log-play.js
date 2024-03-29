const timeLogger = require("@foundernetes/std/time-logger")
const ctx = require("@foundernetes/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const setIndentationContext = require("~/log/set-context-indentation")

const init = (definition) => {
  const { log = true, name } = definition
  const elapsed = timeLogger()
  const logPlayContext = { ...definition, elapsed }
  if (!log) {
    return logPlayContext
  }
  setIndentationContext.incr()
  ctx.replace("logger", (l) =>
    l.child(
      {
        play: name,
      },
      getContextLoggerOptions()
    )
  )
  return logPlayContext
}

const start = ({ name }) => {
  const logger = ctx.getLogger()
  logger.info(`▶️  playing: ${name}`)
  const iteratorSerie = ctx.get("iteratorSerie")
  if (iteratorSerie) {
    logger.setPrefix("├─── ")
  } else {
    logger.setPrefix("──── ")
  }
}

const end = ({ log = true, name, elapsed }) => {
  if (!log) {
    return
  }
  const logger = ctx.getLogger()
  logger.setPrefix("")
  logger.info(`⏹  played: ${name}`)
  elapsed.end({
    label: "🏁 play runned in",
    logger: ctx.getLogger(),
    logLevel: "trace",
  })
}

module.exports = {
  init,
  start,
  end,
}
