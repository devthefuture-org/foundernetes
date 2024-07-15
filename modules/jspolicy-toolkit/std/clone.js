const deepMerge = require("./deepMerge")

module.exports = function clone(params) {
  const {
    kind,
    apiVersion,
    source,
    target,
    syncName = source.resource,
  } = params
  const targetFullPath = `${apiVersion}/${kind}/${target.namespace}/${target.resource}`
  const sourceFullPath = `${apiVersion}/${kind}/${source.namespace}/${source.resource}`

  const sourceObject = get(
    kind,
    apiVersion,
    `${source.namespace}/${source.resource}`
  )
  if (!sourceObject) {
    throw new Error(`clone error: ${sourceFullPath} not found`)
  }
  const result = create(
    deepMerge(sourceObject, {
      metadata: {
        name: target.resource,
        namespace: target.namespace,
        labels: {
          "sync.devthefuture.org": syncName,
        },
      },
    })
  )
  if (!result.ok) {
    if (result.reason === "AlreadyExists") {
      warn(`already exists: ${targetFullPath}`)
    } else {
      warn(
        `error cloning ${targetFullPath} (Reason ${result.reason}): ${result.message}`
      )
    }
  } else {
    print(`${sourceFullPath} cloned to ${targetFullPath}`, result.object)
  }
}
