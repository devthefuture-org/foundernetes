const ctx = require("~/ctx")

const removePrefix = require("~/utils/remove-prefix")
const removeSuffix = require("~/utils/remove-suffix")

module.exports = (definition, type) => {
  const { name } = definition
  if (name) {
    return name
  }
  let { path: pluginPath } = definition
  if (!pluginPath) {
    return
  }
  const config = ctx.require("config")
  const { cwd } = config
  pluginPath = removePrefix(pluginPath, `${cwd}/`)
  pluginPath = removePrefix(pluginPath, `${type}/`)
  pluginPath = removePrefix(pluginPath, `${type}s/`)
  pluginPath = removeSuffix(pluginPath, ".js")
  if (!pluginPath.startsWith("/")) {
    return pluginPath
  }
}
