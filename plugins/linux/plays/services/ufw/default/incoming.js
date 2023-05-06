const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay(async (vars) => {
    const { incoming = "deny" } = vars
    return {
      async check() {
        const status = await loaders.services.ufw({ cache: true })
        return status.default.incoming === incoming
      },
      async run() {
        await $(`ufw default ${incoming} incoming`, { sudo: true })
        loaders.services.ufw.clearCache()
      },
    }
  })
