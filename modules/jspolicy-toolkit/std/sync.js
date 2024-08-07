const cloneObject = require("./cloneObject")
const deepMerge = require("./deepMerge")
const apply = require("./apply")
const cleanupManifest = require("./cleanupManifest")

module.exports = function sync(params = {}) {
  const {
    resource = request.object,
    operation = request.operation,
    syncName = resource.metadata.name,
  } = params
  const resources = list(resource.kind, resource.apiVersion, {
    labelSelector: `sync.devthefuture.org=${syncName}`,
  })
  if (!resources) {
    return
  }
  for (const target of resources) {
    if (operation === "DELETE") {
      remove(target)
    } else {
      const newObject = cloneObject(resource)
      cleanupManifest(newObject)
      deepMerge(newObject, {
        metadata: {
          name: target.metadata.name,
          namespace: target.metadata.namespace,
          labels: {
            "sync.devthefuture.org": syncName,
          },
        },
      })
      apply(newObject, target)
    }
  }
}
