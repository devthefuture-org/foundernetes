const equalManifests = require("./equalManifests")

module.exports = function createApply(request) {
  return function apply(mutable) {
    if (equalManifests(request.object, mutable)) {
      // avoid infinite loop
      return
    }

    const result = update(request.object)
    if (!result.ok) {
      warn(`error updating (Reason ${result.reason}): ${result.message}`)
    } else {
      print("updated", result.object)
    }
  }
}
