const { createPlay, $ } = require("@foundernetes/blueprint")

const execFileExists = require("~/lib/exec-file-exists")

module.exports = async () =>
  createPlay({
    async check(vars) {
      const { dir, sudo, sudoRead = sudo } = vars
      if (
        !(await execFileExists(dir, {
          sudo: sudoRead,
        }))
      ) {
        return false
      }
      return true
    },
    async run(vars) {
      const { dir, sudo, sudoWrite = sudo } = vars
      await $(`mkdir -p ${dir}`, {
        sudo: sudoWrite,
      })
    },
  })
