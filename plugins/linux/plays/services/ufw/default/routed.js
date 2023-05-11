const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay(async (vars) => {
    const { routed = "deny" } = vars
    return {
      async check() {
        const status = await loaders.services.ufw({ cache: true })
        if (status.default.routed === "disabled" && routed === "deny") {
          return true
        }
        return status.default.routed === routed
      },
      async run() {
        await $(`ufw default ${routed} routed`, { sudo: true })
        loaders.services.ufw.clearCache()
      },
    }
  })
