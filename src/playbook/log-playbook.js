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
        playbook: name,
      },
      getContextLoggerOptions()
    )
  )
  logger.info(`📖 launching playbook: ${name}`)
}

const end = ({ logEnabled, name }) => {
  if (!logEnabled) {
    return false
  }
  const logger = ctx.require("logger")
  logger.info(`📕 playbook done: ${name}`)
}

module.exports = { start, end }
