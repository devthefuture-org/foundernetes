const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const addIndentation = require("~/log/add-indentation")

const weakmapIdRegistryFactory = require("~/utils/weakmap-id-registry-factory")

const collectionId = weakmapIdRegistryFactory()

module.exports = () => {
  const collectionContext = ctx.require("collection")

  const { collection, methodName } = collectionContext

  let { collectionName } = collectionContext
  if (!collectionName) {
    collectionName = `#${collectionId(collection)}`
  }

  addIndentation()
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
