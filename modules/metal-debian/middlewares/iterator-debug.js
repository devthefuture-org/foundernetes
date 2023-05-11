const ctx = require("@foundernetes/ctx")

module.exports = (key) => {
  const indentation = ctx.require("indentation")
  const logger = ctx
    .require("logger")
    .child({}, { indentation: (indentation + 1) * 2 })
  switch (key) {
    case "collection": {
      const { collection } = ctx.require("collection")
      logger.debug({ collection }, "🥡 collection")
      break
    }
    case "iteration": {
      const { item, index } = ctx.require("iteration")
      logger.debug({ item, index }, "#️⃣  iteration")
      break
    }
    default:
  }
}
