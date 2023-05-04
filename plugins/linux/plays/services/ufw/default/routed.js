const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    before(vars) {
      const { routed = "deny" } = vars
      return { routed }
    },
    async check(_vars, { routed }) {
      const status = await loaders.services.ufw({ cache: true })
      if (status.default.routed === "disabled" && routed === "deny") {
        return true
      }
      return status.default.routed === routed
    },
    async run(_vars, { routed }) {
      await $(`ufw default ${routed} routed`, { sudo: true })
      loaders.services.ufw.clearCache()
    },
  })
