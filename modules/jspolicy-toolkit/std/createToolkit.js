const createResourceMatch = require("./createResourceMatch")
const createMutable = require("./createMutable")

module.exports = function createToolkit(request) {
  const resourceMatch = createResourceMatch(request)
  const mutable = createMutable(request.object)
  return {
    resourceMatch,
    mutable,
  }
}
