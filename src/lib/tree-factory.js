const get = require("lodash.get")
const defaults = require("lodash.defaults")
const async = require("~/lib/async")

const treeFactory = async (
  factories,
  deps,
  rootKey,
  options,
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

  const { mainKey, autoName, autoTags, tagsPrefix } = options
  await async.eachOf(factories, async (factory, name) => {
    const factoryOptions = get(factoriesDeps, scopeKey)
    if (typeof factory === "function") {
      const factoryName = autoName ? name : undefined
      const factoryTags = []
      if (autoTags) {
        const moduleTag = `${tagsPrefix}:${rootKey}:${scope.join(":")}`
        factoryTags.push(`${moduleTag}:${name}`)
        if (name === mainKey) {
          factoryTags.push(moduleTag)
        }
      }
      const factoryDefaults = { factoryName, factoryTags }
      values[name] = await factory(
        { ...deps, ...factoryOptions },
        factoryDefaults
      )
      if (name === mainKey) {
        const tmp = values
        values = values[name]
        Object.assign(values, tmp)
      }
    } else {
      const childScope = [...scope, name]
      values[name] = await treeFactory(
        factory,
        { ...deps, ...factoryOptions },
        rootKey,
        options,
        childScope,
        {},
        rootValues
      )
    }
  })
  return values
}

const defaultOptions = {
  mainKey: "main",
  autoName: true,
  autoTags: true,
  tagsPrefix: "f10n",
}

module.exports =
  (factoriesTree, rootKey, options = {}) =>
  async (deps) => {
    const tree = await treeFactory(
      factoriesTree,
      deps,
      rootKey,
      defaults(options, defaultOptions)
    )
    // console.dir({ tree }, { depth: Infinity })
    return tree
  }
