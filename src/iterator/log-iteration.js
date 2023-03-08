const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const setIndentationContext = require("~/log/set-context-indentation")

module.exports = () => {
  const iterationContext = ctx.require("iteration")
  const { index } = iterationContext

  setIndentationContext.incr()
  const logger = ctx.replace("logger", (log) =>
    log.child(
      {
        index,
      },
      getContextLoggerOptions()
    )
  )
  const iteratingLabel = index !== undefined ? index : "♾️ "
  logger.info(`↪️  iterating: ${iteratingLabel}`)
}
