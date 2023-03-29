const defaults = require("lodash.defaults")

module.exports =
  (create) =>
  (definition, factoryDefaults = {}) =>
  async (config = {}, override = {}) => {
    if (typeof definition === "function") {
      if (typeof config === "function") {
        config = await config()
      }
      definition = await definition(config)
    }
    if (typeof override === "function") {
      override = await override(definition)
    }

    Object.assign(definition, override)

    defaults(definition, factoryDefaults)

    return create(definition)
  }
