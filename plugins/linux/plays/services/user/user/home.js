const fs = require("fs-extra")
const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { username, home } = vars
      const user = await loaders.services.user({ user: username })
      const exists = await fs.pathExists(home)
      return exists && user.homedir === home
    },

    async run(vars) {
      const { username, home } = vars
      await $(`usermod --home ${home} ${username}`)
      await $(`mkhomedir_helper ${home}`)
    },
  })
