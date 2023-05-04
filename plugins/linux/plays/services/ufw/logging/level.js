const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    before(vars) {
      const { level = "low" } = vars
      return { level }
    },
    async check(_vars, { level }) {
      const status = await loaders.services.ufw({ cache: true })
      return status.logging_level === level
    },
    async run(_vars, { level }) {
      await $(`ufw logging ${level}`, { sudo: true })
      loaders.services.ufw.clearCache()
    },
  })
