const tmp = require("tmp-promise")
const wildstring = require("wildstring")

const { render } = require("@foundernetes/eta")
const deepmerge = require("@foundernetes/std/deepmerge")
const { createPlaybook, createTree } = require("@foundernetes/blueprint")

const ctx = require("~/ctx")

const tree = {
  loaders: require("~/loaders"),
  plays: require("~/plays"),
  // conditions: require("~/conditions"),
}

const createSsh = require("~/lib/ssh")

module.exports = async () => {
  const treeParams = {}

  const { plays, loaders } = await createTree(tree, treeParams)

  const playbook = async ({ inventory } = {}) => {
    const iterator = ctx.getIterator()

    if (!inventory) {
      const inventoryFile = process.env.F10S_MACHINES_FILE || "machines.yaml"
      inventory = await loaders.std.yaml({ file: inventoryFile })
    }

    const { hosts = {}, ...hostDefaults } = inventory
    const { parallelHostsLimit = Infinity, parallelFilesLimit = 1 } = inventory
    tmp.setGracefulCleanup()

    await iterator.eachOfLimit(hosts, parallelHostsLimit, async (h) => {
      const host = deepmerge(
        {
          ssh: {
            address: "127.0.0.1",
            user: "root",
            port: 22,
            // keyPath: "~/.ssh/id_rsa",
          },
          files: [],
          commands: [],
          exportEnv: ["F10S_*"],
          extraExportEnv: [],
        },
        hostDefaults,
        h
      )

      const exportEnvPatterns = [...host.exportEnv, ...host.extraExportEnv]
      const env = Object.entries(process.env)
        .filter(([key]) =>
          exportEnvPatterns.some((pattern) => wildstring.match(pattern, key))
        )
        .reduce((acc, [key, value]) => {
          acc[key] = value
          return acc
        }, {})

      const logger = ctx.getLogger()

      const hostName = host.name || host.ssh.address
      logger.info(`🚀 deploying ${hostName} ...`)

      const ssh = await createSsh(host.ssh)
      ctx.set("ssh", ssh)

      await plays.ssh.gohash()
      await iterator.eachOfLimit(
        host.files,
        parallelFilesLimit,
        async (file) => {
          if (typeof file === "string") {
            file = { source: file }
          }
          const templateVars = {
            host,
          }
          if (file.source) {
            file.source = await render(file.source, templateVars)
          }
          if (file.target) {
            file.target = await render(file.target, templateVars)
          }
          return plays.ssh.sync(file)
        }
      )
      await iterator.eachOfSeries(host.commands, async (command) => {
        if (typeof command === "string") {
          command = { command }
        }
        command.env = { ...(command.env || {}), ...env }
        return plays.ssh.command(command)
      })

      logger.info(`✅ deployed ${hostName}`)
    })
  }
  return createPlaybook({
    playbook,
    plays,
    loaders,
  })
}
