const fs = require("fs-extra")
const { Configuration, Project, StreamReport, Cache } = require("@yarnpkg/core")

// eslint-disable-next-line import/no-unresolved, import/extensions
const yarnpkgPlugins = require("~/build/require-yarnpkg-plugins")

module.exports = async (options = {}) => {
  const {
    stdout = process.stdout,
    cwd = process.cwd(),
    defaultNodeLinker = process.env.SNIPER_DEFAULT_NODE_LINKER ||
      "node-modules",
  } = options

  const modules = new Map()
  const plugins = new Set()
  const pluginConfiguration = {
    modules,
    plugins,
  }
  for (const [dependencyName, dependency] of Object.entries(yarnpkgPlugins)) {
    plugins.add(dependencyName)
    modules.set(dependencyName, dependency)
  }

  const configuration = await Configuration.find(cwd, pluginConfiguration)
  const rcFiles = await Configuration.findRcFiles(cwd)
  if (rcFiles.length === 0 && !(await fs.pathExists(`${cwd}/.pnp.cjs`))) {
    configuration.values.set("nodeLinker", defaultNodeLinker)
  }
  const { project } = await Project.find(configuration, cwd)
  const cache = await Cache.find(configuration)

  const report = new StreamReport({ configuration, stdout })

  const tmpExecArgv = process.execArgv
  process.execArgv = []
  await project.install({ cache, report })
  process.execArgv = tmpExecArgv
}
