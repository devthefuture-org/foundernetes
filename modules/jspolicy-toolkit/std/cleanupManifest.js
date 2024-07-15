module.exports = function cleanupManifest(obj) {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      cleanupManifest(item)
    }
  } else if (typeof obj === "object" && obj !== null) {
    if (obj.metadata) {
      delete obj.metadata.resourceVersion
      delete obj.metadata.uid
      delete obj.metadata.creationTimestamp
      delete obj.metadata.generation
      delete obj.metadata.selfLink
      delete obj.metadata.managedFields
      delete obj.status
    }
    for (const item of Object.values(obj)) {
      cleanupManifest(item)
    }
  }
}
