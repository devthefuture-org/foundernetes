const tmp = require("tmp")

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
        },
        hostDefaults,
        h
      )

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
          return plays.ssh.sync(file)
        }
      )
      await iterator.eachOfSeries(host.commands, async (command) => {
        if (typeof command === "string") {
          command = { command }
        }
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
