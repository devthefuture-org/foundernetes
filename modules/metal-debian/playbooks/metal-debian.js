const path = require("path")
const ctx = require("@foundernetes/ctx")
const { createPlaybook, createTree } = require("@foundernetes/blueprint")
const portRangeExcept = require("@foundernetes/linux/lib/port-range-except")
const traverseAsync = require("@foundernetes/std/traverse-async")
const { render } = require("@foundernetes/eta")

// const iteratorDebugMiddleware = require("~/middlewares/iterator-debug")
const tree = {
  loaders: require("~/loaders"),
  plays: require("~/plays"),
  conditions: require("~/conditions"),
}

module.exports = async () => {
  const treeParams = {
    conditions: {
      machine: { exclude: [process.env.F10S_METALDEBIAN_EXCLUDE_MACHINE] },
    },
  }

  const { plays, loaders, conditions } = await createTree(tree, treeParams)

  const playbook = async () => {
    // ℹ️ get context variables
    // const logger = ctx.getLogger()
    const iterator = ctx.require("iterator")
    // iterator.use(iteratorDebugMiddleware)

    // ℹ️ data
    const dataFiles = [
      path.join(__dirname, "..", "metal-debian.yaml"),
      process.env.F10S_METALDEBIAN_PLAYBOOK_FILE || "metal-debian.yaml",
    ]
    const data = await loaders.std.yaml({
      files: dataFiles,
    })

    await traverseAsync(data, async (value) =>
      typeof value !== "string"
        ? value
        : render(value, data, { tags: ["$${{", "}}"] })
    )

    // ℹ️ authorizedKeys
    const authorizedKeys = [
      ...(data.authorizedKeys || []),
      ...(process.env.F10S_METALDEBIAN_AUTHORIZED_KEYS
        ? process.env.F10S_METALDEBIAN_AUTHORIZED_KEYS.split("\n")
        : []),
    ]

    await iterator.eachSeries(
      authorizedKeys,
      (publicKey) => plays.services.authorizeKey({ publicKey }),
      "authorizedKey"
    )

    // ℹ️ boot
    await plays.onBoot({})

    // ℹ️ systemdPager
    await plays.services.setSystemdPager({})

    // ℹ️ dns
    await plays.services.dns({
      dns: data.dns,
    })

    // ℹ️ wait for dns
    await plays.waitfor.dns({}, { tags: ["not-on-preseed"] })

    // ℹ️ apt sources
    await plays.services.aptSources({})

    // ℹ️ apt update on sources changes
    await plays.services.aptUpdateOnSourceChanges({})

    // ℹ️ apt-update
    await plays.services.aptUpdate({})

    // ℹ️ packages
    const packages = await loaders.services.packages({
      packages: data.packages,
    })
    await iterator.eachOfSeries(
      packages,
      async (pkg) => {
        return plays.services.installPackage(pkg, {
          tags: [
            "packages",
            "install-packages",
            ({ name }) => `f10s:play:package:${name}`,
            ...(pkg.tags || []),
          ],
        })
      },
      "packages"
    )

    await plays.services.activeService({ name: "ssh" }, { tags: ["sshd"] })
    await plays.services.sshd.config(
      {
        config: data.sshdConfig,
      },
      { tags: ["sshd"] }
    )

    await plays.services.fail2ban(
      {
        templateVars: {
          port: portRangeExcept(null, [80, 443]),
          jaild: {
            sshd: {},
            portsentry: {},
          },
          filterd: {},
        },
      },
      { tags: ["fail2ban"] }
    )

    await plays.services.portsentry(
      {},
      { tags: ["portsentry"], if: [conditions.machine] }
    )

    await plays.services.rkhunter(
      {},
      { tags: ["rkhunter"], if: [conditions.machine] }
    )

    await plays.services.unattendedUpgrades(
      {},
      { tags: ["apt", "unattended-upgrades"] }
    )

    await plays.services.ufw(data.ufw, { tags: ["not-on-preseed"] })

    await plays.services.cron()

    await plays.services.logrotate()

    await plays.services.disableLoginTerminal()
  }

  return createPlaybook({
    playbook,
    plays,
    loaders,
  })
}
