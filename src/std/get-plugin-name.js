const removeSuffix = require("~/utils/remove-suffix")
const treeName = require("~/tree/name")

module.exports = (definition, func) => {
  if (func.funcName) {
    return func.funcName
  }

  const { name } = definition
  if (name) {
    return name
  }

  let { path: pluginPath } = definition
  if (pluginPath) {
    pluginPath = pluginPath.split("/").pop()
    pluginPath = removeSuffix(pluginPath, ".js")
    return pluginPath
  }

  return treeName(func)
}
