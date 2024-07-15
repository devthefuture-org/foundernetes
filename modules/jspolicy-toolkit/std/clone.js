module.exports = function clone(params) {
  const { kind, apiVersion, source, target } = params
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
  const result = create({
    apiVersion,
    kind,
    metadata: {
      name: target.resource,
      namespace: target.namespace,
    },
    data: sourceObject.data,
  })
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
