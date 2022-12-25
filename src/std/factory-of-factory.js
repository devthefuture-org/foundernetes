const getCallerPath = require("~/utils/get-caller-path")

module.exports = (create) => (definition) => {
  const callerPath = getCallerPath()
  return async (override = {}) => {
    if (typeof definition === "function") {
      definition = await definition()
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
