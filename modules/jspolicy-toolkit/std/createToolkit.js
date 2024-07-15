const createResourceMatch = require("./createResourceMatch")
const createApply = require("./createApply")
const createMutable = require("./createMutable")

module.exports = function createToolkit(request) {
  const resourceMatch = createResourceMatch(request)
  const apply = createApply(request)
  const mutable = createMutable(request.object)
  return {
    resourceMatch,
    apply,
    mutable,
  }
}
