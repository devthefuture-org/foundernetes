const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const addIndentation = require("~/log/add-indentation")

const start = ({ logEnabled, name }) => {
  if (!logEnabled) {
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
  logger.info(`⏬ loading: ${name}`)
  logger.setPrefix("├─── ")
}

const end = ({ logEnabled, name }) => {
  if (!logEnabled) {
    return false
  }
  const logger = ctx.require("logger")
  logger.info(`⤵️ loaded: ${name}`)
}

module.exports = { start, end }
