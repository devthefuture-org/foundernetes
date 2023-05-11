const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { username, inactive } = vars
      const actualPassword = await loaders.services.password({ username })
      return actualPassword.inactive === inactive
    },
    async run(vars) {
      const { username, inactive } = vars
      await $(`chage --inactive ${inactive} ${username}`, {
        sudo: true,
      })
    },
  })
