const defaults = require("lodash.defaults")

module.exports =
  (create, meta = {}) =>
  (definition, factoryDefaults = {}) => {
    const exported = async (deps = {}, createDefaults = {}) => {
      // console.log({ createDefaults })
      if (typeof definition === "function") {
        if (typeof deps === "function") {
          deps = await deps()
        }
        definition = await definition(deps)
      }
      if (typeof createDefaults === "function") {
        createDefaults = await createDefaults(definition)
      }

      Object.assign(definition, createDefaults)

      defaults(definition, factoryDefaults)
      if (factoryDefaults.tags) {
        definition.tags = [...(definition.tags || []), ...factoryDefaults.tags]
      }

      return create(definition)
    }

    Object.assign(exported, meta)

    return exported
  }
