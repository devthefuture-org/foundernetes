// const path = require("path")

// const ctx = require("~/ctx")

// const removePrefix = require("~/utils/remove-prefix")
const removeSuffix = require("~/utils/remove-suffix")

module.exports = (definition, _type) => {
  const { name } = definition
  if (name) {
    return name
  }
  const { factoryName } = definition
  if (factoryName) {
    return factoryName
  }

  let { path: pluginPath } = definition
  if (!pluginPath) {
    return
  }

  // const config = ctx.require("config")
  // const { cwd } = config
  // pluginPath = removePrefix(pluginPath, `${cwd}/`)
  // pluginPath = removePrefix(pluginPath, `${path.dirname(process.argv[1])}/`)
  // pluginPath = removePrefix(pluginPath, `${type}/`)
  // pluginPath = removePrefix(pluginPath, `${type}s/`)
  pluginPath = pluginPath.split("/").pop()

  pluginPath = removeSuffix(pluginPath, ".js")

  // if (!pluginPath.startsWith("/")) {
  return pluginPath
  // }
}
