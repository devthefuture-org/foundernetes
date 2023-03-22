const get = require("lodash.get")
const async = require("~/lib/async")

const treeFactory = async (
  factories,
  deps,
  rootKey,
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
    } else {
      const childScope = [...scope, name]
      values[name] = await treeFactory(
        factory,
        { ...deps, ...options },
        rootKey,
        childScope,
        {},
        rootValues
      )
    }
  })
  return values
}

module.exports = (factoriesTree, rootKey) => async (deps) =>
  treeFactory(factoriesTree, deps, rootKey)
