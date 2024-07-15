const equalManifests = require("./equalManifests")

module.exports = function apply(mutable, original = request.object) {
  if (equalManifests(original, mutable)) {
    // avoid infinite loop
    return false
  }

  const result = update(mutable)
  if (!result.ok) {
    warn(`error updating (Reason ${result.reason}): ${result.message}`)
  } else {
    print("updated", result.object)
  }
  return true
}
