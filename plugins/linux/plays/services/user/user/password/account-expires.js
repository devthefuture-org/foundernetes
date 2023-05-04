// $(date -d +90days +%Y-%m-%d)

const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { username, accountExpires } = vars
      const actualPassword = await loaders.services.password({ username })
      return actualPassword.accountExpires === accountExpires
    },
    async run(vars) {
      const { username, accountExpires } = vars
      await $(`chage --expiredate ${accountExpires} ${username}`, {
        sudo: true,
      })
    },
  })
