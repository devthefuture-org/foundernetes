const ctx = require("~/ctx")

const getLoggerOptions = require("./get-logger-options")

const collectionId = require("./collection-id")

module.exports = ({ collection, methodName, collectionName }) => {
  if (!collectionName) {
    collectionName = `#${collectionId(collection)}`
  }

  const logger = ctx.replace("logger", (log) =>
    log.child(
      {
        collection: collectionName,
      },
      getLoggerOptions()
    )
  )
  logger.info(`🔁 looping ${methodName}: ${collectionName}`)
}
