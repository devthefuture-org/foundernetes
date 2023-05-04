const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async () =>
  createPlay({
    defaultTags: ["*"],
    async check(vars) {
      const { mode, file, sudo = false, sudoRead = sudo } = vars
      const { stdout: actualMode } = await $(`stat --format '%a' ${file}`, {
        sudo: sudoRead,
      })
      if (actualMode !== mode) {
        return false
      }
      return true
    },
    async run(vars) {
      const { mode, file, sudo = true, sudoWrite = sudo } = vars
      await $(`chmod ${mode} ${file}`, { sudo: sudoWrite })
    },
  })
