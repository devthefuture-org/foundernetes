const cloneObject = require("./cloneObject")
const cleanupManifest = require("./cleanupManifest")

module.exports = function createMutable(obj) {
  obj = cloneObject(obj)
  cleanupManifest(obj)
  return obj
}
