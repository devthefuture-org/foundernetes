const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { enable = true } = vars
      const status = await loaders.services.ufw({ cache: true })
      return status.status === (enable ? "active" : "inactive")
    },
    async run(vars) {
      const { enable = true } = vars
      await $(`ufw default allow incoming`, { sudo: true }) // avoid to be blocked
      await $(`ufw --force ${enable ? "enable" : "disable"}`, { sudo: true })
      loaders.services.ufw.clearCache()
    },
  })
