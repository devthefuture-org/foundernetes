const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { username, maxDays } = vars
      const actualPassword = await loaders.services.password({ username })
      return actualPassword.maxDays === maxDays
    },
    async run(vars) {
      const { username, maxDays } = vars
      await $(`chage --maxdays ${maxDays} ${username}`, {
        sudo: true,
      })
    },
  })
