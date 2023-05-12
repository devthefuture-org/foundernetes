const path = require("path")
const ctx = require("@foundernetes/ctx")
const { createPlaybook, createTree } = require("@foundernetes/blueprint")
const deepmerge = require("@foundernetes/std/deepmerge")
const traverseAsync = require("@foundernetes/std/traverse-async")
const { render } = require("@foundernetes/eta")

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
    const dataFile = process.env.F10S_LXDKUBE_PLAYBOOK_FILE || "lxd-kube.yaml"
    const defaultData = await loaders.std.yaml({
      file: path.join(__dirname, "..", "lxd-kube.yaml"),
    })
    let data = await loaders.std.yaml({ file: dataFile })
    data = deepmerge({}, defaultData, data)

    await traverseAsync(data, async (value) =>
      typeof value !== "string"
        ? value
        : render(value, data, { tags: ["$${{", "}}"] })
    )

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
