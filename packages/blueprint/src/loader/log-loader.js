const timeLogger = require("@foundernetes/std/time-logger")
const ctx = require("@foundernetes/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const setIndentationContext = require("~/log/set-context-indentation")

const init = (definition) => {
  const { log = true, name } = definition
  const elapsed = timeLogger()
  const logLoaderContext = { ...definition, elapsed }
  ctx.set("parentLogger", ctx.getLogger())
  if (!log) {
    return logLoaderContext
  }
  setIndentationContext.incr()
  ctx.replace("logger", (l) =>
    l.child(
      {
        loader: name,
      },
      getContextLoggerOptions()
    )
  )
  return logLoaderContext
}
const start = ({ name }) => {
  const logger = ctx.getLogger()
  logger.info(`🔻  loading: ${name}`)
  logger.setPrefix("├─── ")
}

const end = ({ log = true, name, elapsed }) => {
  if (!log) {
    return false
  }
  const logger = ctx.getLogger()
  logger.setPrefix("")
  logger.info(`🔺  loaded: ${name}`)
  elapsed.end({
    label: "🏁 loader runned in",
    logger: ctx.getLogger(),
    logLevel: "trace",
  })
}

module.exports = { init, start, end }
