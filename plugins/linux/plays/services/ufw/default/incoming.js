const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    before(vars) {
      const { incoming = "deny" } = vars
      return { incoming }
    },
    async check(_vars, { incoming }) {
      const status = await loaders.services.ufw({ cache: true })
      return status.default.incoming === incoming
    },
    async run(_vars, { incoming }) {
      await $(`ufw default ${incoming} incoming`, { sudo: true })
      loaders.services.ufw.clearCache()
    },
  })
