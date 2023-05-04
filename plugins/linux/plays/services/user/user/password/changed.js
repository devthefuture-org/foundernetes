const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { username, changed } = vars
      const actualPassword = await loaders.services.password({ username })
      return actualPassword.changed === changed
    },
    async run(vars) {
      const { username, changed } = vars
      await $(`chage --lastday ${changed} ${username}`, {
        sudo: true,
      })
    },
  })
