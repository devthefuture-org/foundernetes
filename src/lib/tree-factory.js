const get = require("lodash.get")
const async = require("~/lib/async")

const treeFactory = async (
  factories,
  deps,
  rootKey,
  mainKey,
  scope = [],
  values = {},
  rootValues = values
) => {
  deps = { ...deps, module: values }
  if (rootKey) {
    deps[rootKey] = rootValues
  }

  const factoriesDeps = {}

  const scopeKey = scope.join(".")

  await async.eachOf(factories, async (factory, name) => {
    const options = get(factoriesDeps, scopeKey)
    if (typeof factory === "function") {
      values[name] = await factory({ ...deps, ...options })
      if (name === "main") {
        const tmp = values
        values = values[name]
        Object.assign(values, tmp)
      }
    } else {
      const childScope = [...scope, name]
      values[name] = await treeFactory(
        factory,
        { ...deps, ...options },
        rootKey,
        mainKey,
        childScope,
        {},
        rootValues
      )
    }
  })
  return values
}

module.exports =
  (factoriesTree, rootKey, mainKey = "main") =>
  async (deps) =>
    treeFactory(factoriesTree, deps, rootKey, mainKey)
