const get = require("lodash.get")
const async = require("@foundernetes/async")

const symbols = require("./symbols")

const treeRecursiveFactory = async (
  factories,
  factoriesParams,
  parentDeps,
  parentScope = [],
  values = {},
  rootValues = values
) => {
  parentScope = parentScope.filter((s) => s)

  const deps = { mod: {}, children: {}, ...parentDeps, ...rootValues }

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

module.exports = async (tree, treeParams = {}) => {
  const composition = await treeRecursiveFactory(tree, treeParams)
  // dbug(composition).k()
  return composition
}
