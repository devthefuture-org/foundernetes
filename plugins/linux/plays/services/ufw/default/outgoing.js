const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    before(vars) {
      const { outgoing = "allow" } = vars
      return { outgoing }
    },
    async check(_vars, { outgoing }) {
      const status = await loaders.services.ufw({ cache: true })
      return status.default.outgoing === outgoing
    },
    async run(_vars, { outgoing }) {
      await $(`ufw default ${outgoing} outgoing`, { sudo: true })
      loaders.services.ufw.clearCache()
    },
  })
