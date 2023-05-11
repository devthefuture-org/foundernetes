const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay(async (vars) => {
    const { outgoing = "allow" } = vars
    return {
      async check() {
        const status = await loaders.services.ufw({ cache: true })
        return status.default.outgoing === outgoing
      },
      async run() {
        await $(`ufw default ${outgoing} outgoing`, { sudo: true })
        loaders.services.ufw.clearCache()
      },
    }
  })
