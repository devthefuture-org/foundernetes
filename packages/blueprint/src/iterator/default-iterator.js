const create = require("./create")

const logCollection = require("./log-collection")
const logIteration = require("./log-iteration")

const loggers = {
  collection: logCollection,
  iteration: logIteration,
}

const iterator = create()
iterator.use((key, args) => {
  const logCallback = loggers[key]
  if (!logCallback) {
    return
  }
  logCallback(...args)
})

module.exports = iterator
