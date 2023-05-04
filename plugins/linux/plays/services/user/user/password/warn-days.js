const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { username, warnDays } = vars
      const actualPassword = await loaders.services.password({ username })
      return actualPassword.warnDays === warnDays
    },
    async run(vars) {
      const { username, warnDays } = vars
      await $(`chage --warndays ${warnDays} ${username}`, {
        sudo: true,
      })
    },
  })
