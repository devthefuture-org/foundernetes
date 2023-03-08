const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const setIndentationContext = require("~/log/set-context-indentation")

const weakmapIdRegistryFactory = require("~/utils/weakmap-id-registry-factory")

const collectionId = weakmapIdRegistryFactory()

module.exports = () => {
  const collectionContext = ctx.require("collection")

  const { collection, methodName } = collectionContext

  let { collectionName } = collectionContext
  if (!collectionName) {
    collectionName = `#${collectionId(collection)}`
  }

  setIndentationContext.incr()
  const logger = ctx.replace("logger", (log) =>
    log.child(
      {
        collection: collectionName,
      },
      getContextLoggerOptions()
    )
  )
  logger.info(`🔁 looping ${methodName}: ${collectionName}`)
}
