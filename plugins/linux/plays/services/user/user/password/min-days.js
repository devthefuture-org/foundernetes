const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { username, minDays } = vars
      const actualPassword = await loaders.services.password({ username })
      return actualPassword.minDays === minDays
    },
    async run(vars) {
      const { username, minDays } = vars
      await $(`chage --mindays ${minDays} ${username}`, {
        sudo: true,
      })
    },
  })
