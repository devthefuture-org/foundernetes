const ctx = require("~/ctx")

const getLoggerOptions = require("./get-logger-options")

const id = (() => {
  let currentId = 0
  const map = new WeakMap()

  return (object) => {
    if (!map.has(object)) {
      map.set(object, ++currentId)
    }

    return map.get(object)
  }
})()

module.exports = ({ collection, methodName }) => {
  const collectionId = `#${id(collection)}`
  const logger = ctx.replace("logger", (log) =>
    log.child(
      {
        collection: collectionId,
      },
      getLoggerOptions()
    )
  )
  logger.info(`🔁 looping ${methodName}: ${collectionId}`)
}
