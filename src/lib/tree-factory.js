const get = require("lodash.get")
const defaults = require("lodash.defaults")
const async = require("~/lib/async")

// const objectSortKeys = require("~/utils/object-sort-keys")

const treeFactory = async (
  factories,
  deps,
  rootKey,
  options,
  scope = [],
  values = {},
  rootValues = values
) => {
  const mod = {}
  deps = { ...deps, mod }
  if (rootKey) {
    deps[rootKey] = rootValues
  }

  const factoriesDeps = {}

  const scopeKey = scope.join(".")

  const { mainKey, autoName, autoTags, tagsPrefix } = options

  // factories = objectSortKeys(factories, (key) => (key === mainKey ? 1 : 0))

  await async.eachOfSeries(factories, async (factory, name) => {
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
      const { composable = false } = factory
      const factoryParams = { ...deps, ...factoryOptions }
      if (composable) {
        factories[name] = async (
          factoryParamsOverride = {},
          factoryDefaultsOverride = {}
        ) => {
          const composed = async (factoryDefaultsOverrideFromComposer) =>
            factory(
              { ...factoryParams, ...factoryParamsOverride },
              {
                ...factoryDefaults,
                ...factoryDefaultsOverride,
                factoryName: factoryDefaultsOverrideFromComposer.factoryName,
                factoryTags: [
                  ...factoryTags,
                  ...(factoryDefaultsOverride.factoryTags || []),
                  ...(factoryDefaultsOverrideFromComposer.factoryTags || []),
                ],
              }
            )
          composed.composed = true
          return composed
        }
        return
      }
      const component = await factory(factoryParams, factoryDefaults)
      values[name] = component
      mod[name] = component
      if (name === mainKey) {
        values = values[name]
      }
      if (component.composed) {
        values[name] = await values[name](factoryDefaults)
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
  Object.assign(mod, values)
  return values
}

const defaultOptions = {
  mainKey: "main",
  autoName: true,
  autoTags: true,
  tagsPrefix: "f10n",
}

module.exports = (factoriesTree, rootKey, options = {}) => {
  const factory = async (deps) => {
    const tree = await treeFactory(
      factoriesTree,
      deps,
      rootKey,
      defaults(options, defaultOptions)
    )
    // process.exit(0)
    return tree
  }
  factory.factories = factoriesTree
  // console.dir({ factory }, { depth: Infinity })
  return factory
}
