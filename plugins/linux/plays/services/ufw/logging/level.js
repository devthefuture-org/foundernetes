const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay(async (vars) => {
    const { level = "low" } = vars
    return {
      async check() {
        const status = await loaders.services.ufw({ cache: true })
        return status.logging_level === level
      },
      async run() {
        await $(`ufw logging ${level}`, { sudo: true })
        loaders.services.ufw.clearCache()
      },
    }
  })
