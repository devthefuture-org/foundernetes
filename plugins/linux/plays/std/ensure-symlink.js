const ctx = require("@foundernetes/ctx")
const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) =>
  createPlay({
    defaultTags: ["*"],
    async check(vars) {
      const { link, target, sudo = false, _sudoRead = sudo } = vars
      const {
        exitCode,
        error,
        target: actualTarget,
      } = await loaders.std.symlink({ link })
      if (exitCode !== 0) {
        const logger = ctx.getLogger()
        logger.error(error)
        return false
      }
      return actualTarget === target
    },
    async run(vars) {
      const {
        link,
        target,
        sudo = false,
        replace = true,
        replaceRecursive = false,
        sudoWrite = sudo,
        sudoRead = sudo,
      } = vars
      if (replace) {
        const { exitCode } = await $(`test -e ${link}`, {
          sudo: sudoRead,
          logStd: false,
          reject: false,
        })
        if (exitCode === 0) {
          await $(`rm -${replaceRecursive ? "r" : ""}f ${link}`, {
            sudo: sudoWrite,
          })
        }
      }
      await $(`ln -s ${target} ${link}`, { sudo: sudoWrite })
    },
  })
