const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const setIndentationContext = require("~/log/set-context-indentation")
const timeLogger = require("~/utils/time-logger")

const init = (definition) => {
  const { log = true, name } = definition
  const elapsed = timeLogger()
  const logLoaderContext = { ...definition, elapsed }
  ctx.set("parentLogger", ctx.require("logger"))
  if (!log) {
    return logLoaderContext
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
  return logLoaderContext
}
const start = ({ name }) => {
  const logger = ctx.require("logger")
  logger.info(`🔻  loading: ${name}`)
  logger.setPrefix("├─── ")
}

const end = ({ log = true, name, elapsed }) => {
  if (!log) {
    return false
  }
  const logger = ctx.require("logger")
  logger.setPrefix("")
  logger.info(`🔺  loaded: ${name}`)
  elapsed.end({
    label: "🏁 loader runned in",
    logger: ctx.require("logger"),
    logLevel: "trace",
  })
}

module.exports = { init, start, end }
