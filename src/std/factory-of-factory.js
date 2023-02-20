const getCallerPath = require("~/utils/get-caller-path")

module.exports = (create) => (definition) => {
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
    override = { ...override }
    if (typeof override.middlewares === "function") {
      override.middlewares = await override.middlewares(definition)
    }

    const path = callerPath
    return create({ path, ...definition, ...override })
  }
}
