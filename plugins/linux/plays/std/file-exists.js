const path = require("path")

const { createPlay, $ } = require("@foundernetes/blueprint")

const execFileExists = require("~/lib/exec-file-exists")

module.exports = async () =>
  createPlay({
    defaultTags: ["*"],
    async check(vars) {
      const { file, sudo, sudoRead = sudo } = vars
      if (!(await execFileExists(file, { sudo: sudoRead }))) {
        return false
      }
      return true
    },
    async run(vars) {
      const { file, sudo, sudoWrite = sudo } = vars
      await $(`mkdir -p ${path.dirname(file)}`, {
        sudo: sudoWrite,
      })
      await $(`touch ${file}`, { sudo })
    },
  })
