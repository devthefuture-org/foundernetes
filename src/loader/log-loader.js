const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const setIndentationContext = require("~/log/set-context-indentation")

const start = ({ log = true, name }) => {
  ctx.set("parentLogger", ctx.require("logger"))
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
  logger.info(`🔻  loading: ${name}`)
  logger.setPrefix("├─── ")
}

const end = ({ log = true, name }) => {
  if (!log) {
    return false
  }
  const logger = ctx.require("logger")
  logger.setPrefix("")
  logger.info(`🔺  loaded: ${name}`)
}

module.exports = { start, end }
