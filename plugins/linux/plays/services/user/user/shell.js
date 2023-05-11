const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { username, shell } = vars
      const user = await loaders.services.user({ user: username })
      return user.shell === shell
    },

    async run(vars) {
      const { username, shell } = vars
      await $(`usermod -s ${shell} ${username}`)
    },
  })
