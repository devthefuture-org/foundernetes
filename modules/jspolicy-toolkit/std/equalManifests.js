const cloneObject = require("./cloneObject")
const cleanupManifest = require("./cleanupManifest")
const deepEqual = require("./deepEqual")
const sortObjectByKeyDeep = require("./sortObjectByKeyDeep")

module.exports = function equalManifests(manifest1, manifest2) {
  manifest1 = cloneObject(manifest1)
  manifest2 = cloneObject(manifest2)
  cleanupManifest(manifest1)
  cleanupManifest(manifest2)
  manifest1 = sortObjectByKeyDeep(manifest1)
  manifest2 = sortObjectByKeyDeep(manifest2)
  return deepEqual(manifest1, manifest2)
}
