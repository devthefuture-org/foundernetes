const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { enable = true } = vars
      const status = await loaders.services.ufw({ cache: true })
      return status.logging === (enable ? "on" : "off")
    },
    async run(vars) {
      const { enable = true } = vars
      await $(`ufw logging ${enable ? "on" : "off"}`, { sudo: true })
      loaders.services.ufw.clearCache()
    },
  })
