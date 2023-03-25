const defaults = require("lodash.defaults")
const getCallerPath = require("~/utils/get-caller-path")

module.exports =
  (create) =>
  (definition, factoryDefaults = {}) => {
    const callerPath = getCallerPath()
    return async (config = {}, override = {}) => {
      if (typeof definition === "function") {
        if (typeof config === "function") {
          config = await config()
        }
        definition = await definition(config)
      }
      if (typeof override === "function") {
        override = await override(definition)
      }

      Object.assign(definition, { path: callerPath, ...override })

      defaults(definition, factoryDefaults)

      return create(definition)
    }
  }
