const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { username, gid } = vars
      const user = await loaders.services.user({ user: username })
      return user.gid === gid
    },

    async run(vars) {
      const { username, gid } = vars
      await $(`usermod -g ${gid} ${username}`, { sudo: true })
    },
  })
