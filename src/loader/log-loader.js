const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const setIndentationContext = require("~/log/set-context-indentation")
const timeLogger = require("~/utils/time-logger")

const start = (definition) => {
  const { log = true, name } = definition
  const elapsed = timeLogger()
  const logLoaderContext = { ...definition, elapsed }
  ctx.set("parentLogger", ctx.require("logger"))
  if (!log) {
    return logLoaderContext
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
  logger.info(`🔻  loading: ${name}`)
  logger.setPrefix("├─── ")
  return logLoaderContext
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

module.exports = { start, end }
