const ctx = require("~/ctx")

const getLoggerOptions = require("./get-logger-options")

module.exports = ({ name }) => {
  const logger = ctx.replace("logger", (log) =>
    log.child(
      {
        playbook: name,
      },
      getLoggerOptions()
    )
  )
  logger.info(`📖 launching playbook: ${name}`)
}
