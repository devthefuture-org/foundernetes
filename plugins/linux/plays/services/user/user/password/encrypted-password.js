// $(openssl passwd -1 ${PASSWORD})
const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    async check(vars) {
      const { username, encryptedPassword } = vars
      const actualPassword = await loaders.services.password({ username })
      return actualPassword.password === encryptedPassword
    },
    async run(vars) {
      const { username, encryptedPassword } = vars
      await $(`usermod --password ${encryptedPassword} ${username}`, {
        sudo: true,
      })
    },
  })
