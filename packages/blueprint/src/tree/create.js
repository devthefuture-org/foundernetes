const get = require("lodash/get")
const async = require("@foundernetes/async")

const symbols = require("./symbols")

const treeRecursiveFactory = async (
  factories,
  factoriesParams,
  commonParams,
  parentDeps,
  parentScope = [],
  values = {},
  rootValues = values
) => {
  parentScope = parentScope.filter((s) => s)

  const deps = {
    ...commonParams,
    mod: {},
    children: {},
    ...parentDeps,
    ...rootValues,
  }

  await async.eachOfSeries(Object.keys(factories), async (name) => {
    const factory = factories[name]

    const scope = [...parentScope, name]

    const scopeKey = scope.join(".")
    const factoryCompositionParams = get(factoriesParams, scopeKey)

    deps.children = {}

    if (typeof factory === "function") {
      const factoryParams = {
        ...deps,
        ...factoryCompositionParams,
      }
      const component = (await factory(factoryParams)) || {}
      component[symbols.scope] = scope
      values[name] = component
    } else {
      values[name] = {}
    }

    const branch = await treeRecursiveFactory(
      factory,
      factoriesParams,
      commonParams,
      deps,
      scope,
      {},
      rootValues
    )
    Object.assign(values[name], branch)
    Object.assign(deps.children, branch)
    deps.mod[name] = values[name]
  })

  return values
}

module.exports = async (tree, treeParams = {}, commonParams = {}) => {
  const composition = await treeRecursiveFactory(tree, treeParams, commonParams)
  // dbug(composition).k()
  return composition
}
