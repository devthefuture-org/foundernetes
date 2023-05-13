const path = require("path")
const fs = require("fs-extra")

const { createPlay, $ } = require("@foundernetes/blueprint")
const deepmerge = require("@foundernetes/std/deepmerge")
const yaml = require("@foundernetes/std/yaml")
const ctx = require("@foundernetes/ctx")

module.exports = async () => {
  return createPlay(
    async (vars) => {
      const { preseed: userPreseed = {} } = vars
      const defaultPreseedYaml = await fs.readFile(
        path.join(__dirname, "preseed.yaml"),
        { encoding: "utf-8" }
      )
      const defaultPreseed = yaml.load(defaultPreseedYaml)
      const preseed = deepmerge({}, defaultPreseed, userPreseed)
      const preseedYaml = yaml.dump(preseed)

      const config = ctx.getConfig()
      const preseedFactFile = path.join(config.factsPath, "lxd/preseed.yaml")

      const { upgrade = true } = vars

      const logger = ctx.getLogger()

      return {
        async check() {
          const lxdbr0IpLink = await $("ip link show lxdbr0", {
            sudo: true,
            reject: false,
          })
          if (lxdbr0IpLink.exitCode !== 0) {
            return false
          }

          const network = await $("lxc query local:/1.0/networks/lxdbr0", {
            sudo: true,
            reject: false,
          })
          if (network.exitCode !== 0) {
            return false
          }
          const { managed: hasNetDevice } = JSON.parse(network.stdout)

          const { stdout: storageJSON } = await $(
            "lxc query local:/1.0/storage-pools",
            {
              sudo: true,
            }
          )
          const storage = JSON.parse(storageJSON)
          if (!(hasNetDevice && storage.length > 0)) {
            return false
          }

          if (upgrade) {
            const exists = await fs.pathExists(preseedFactFile)
            const previousPreseedYaml = exists
              ? await fs.readFile(preseedFactFile, {
                  encoding: "utf-8",
                })
              : null
            if (previousPreseedYaml !== preseedYaml) {
              logger.debug("lxd updated preseed")
              return false
            }
          }
          return true
        },
        async run() {
          await $("lxd init --preseed", { sudo: true, input: preseedYaml })
          await fs.ensureDir(path.dirname(preseedFactFile))
          await fs.writeFile(preseedFactFile, preseedYaml)
        },
      }
    },
    {
      tags: ["lxd"],
    }
  )
}
