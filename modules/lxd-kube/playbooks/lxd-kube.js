const path = require("path")
const ctx = require("@foundernetes/ctx")
const { createPlaybook, createTree } = require("@foundernetes/blueprint")

const tree = {
  loaders: require("~/loaders"),
  plays: require("~/plays"),
  // conditions: require("~/conditions"),
}

module.exports = async () => {
  const treeParams = {}

  const { plays, loaders } = await createTree(tree, treeParams)

  const playbook = async () => {
    // ℹ️ get context variables
    // const logger = ctx.getLogger()
    const iterator = ctx.require("iterator")

    // ℹ️ data
    const dataFiles = [
      path.join(__dirname, "..", "lxd-kube.yaml"),
      process.env.F10S_LXDKUBE_PLAYBOOK_FILE || "lxd-kube.yaml",
    ]
    const data = await loaders.std.yaml({
      files: dataFiles,
    })

    // ℹ️ authorizedKeys
    const authorizedKeys = [
      ...(data.authorizedKeys || []),
      ...(process.env.F10S_LXDKUBE_AUTHORIZED_KEYS
        ? process.env.F10S_LXDKUBE_AUTHORIZED_KEYS.split("\n")
        : []),
    ]

    await iterator.eachSeries(
      authorizedKeys,
      (publicKey) => plays.services.authorizeKey({ publicKey }),
      "authorizedKey"
    )

    await plays.services.k0sctl({
      authorizedKeys: data.authorizedKeys,
      ...(data.k0sctl || {}),
    })
  }

  return createPlaybook({
    playbook,
    plays,
    loaders,
  })
}
