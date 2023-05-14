const path = require("path")

const fs = require("fs-extra")

const yaml = require("@foundernetes/std/yaml")
const ctx = require("@foundernetes/ctx")
const { createPlay, $ } = require("@foundernetes/blueprint")
const untildify = require("@foundernetes/std/untildify")

module.exports = async ({ loaders }) => {
  const outputLxdConfig = async (lxdConfig, vars) => {
    const cloudInitUserData = lxdConfig.config?.["cloud-init.user-data"]
    if (cloudInitUserData && typeof cloudInitUserData !== "string") {
      lxdConfig.config["cloud-init.user-data"] = yaml.dump(cloudInitUserData)
    }
    let { sshAuthorizedKey, sshAuthorizedKeyFile = "~/.ssh/id_rsa.pub" } = vars
    if (!sshAuthorizedKey && sshAuthorizedKeyFile) {
      sshAuthorizedKeyFile = untildify(sshAuthorizedKeyFile)
      sshAuthorizedKey = await fs.readFile(sshAuthorizedKeyFile, {
        encoding: "utf-8",
      })
    }

    const data = await loaders.std.yaml({
      data: lxdConfig,
      vars: { sshAuthorizedKey },
    })
    return yaml.dump(data)
  }
  const config = ctx.getConfig()

  return createPlay(
    async (vars) => {
      const { name, image, lxdConfig } = vars
      const lxdConfigStr = await outputLxdConfig(lxdConfig, vars)
      const nodeFactFile = path.join(config.factsPath, `lxc/nodes/${name}.yaml`)

      return {
        async check() {
          const { stdout } = await $(`lxc list -f json`)
          const nodes = JSON.parse(stdout)
          const node = nodes.find((n) => n.name === name)
          if (!node) {
            return false
          }
          const exists = await fs.pathExists(nodeFactFile)
          const previousNode = exists
            ? await fs.readFile(nodeFactFile, {
                encoding: "utf-8",
              })
            : null
          return lxdConfigStr === previousNode
        },
        async run() {
          // dbug({ cmd: `lxc launch ${image} ${name}`, lxdConfigStr }).k()
          await $(`lxc launch ${image} ${name}`, {
            input: lxdConfigStr,
            // sudo: true,
          })
          await fs.ensureDir(path.dirname(nodeFactFile))
          await fs.writeFile(nodeFactFile, lxdConfigStr)
        },
      }
    },
    {
      tags: ["lxd"],
    }
  )
}
