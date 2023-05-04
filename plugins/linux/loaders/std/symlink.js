const { createLoader, $ } = require("@foundernetes/blueprint")

module.exports = () =>
  createLoader({
    load: async (vars) => {
      const { link, sudo = false } = vars
      const {
        stdout: target,
        stderr,
        exitCode,
      } = await $(`readlink -f ${link}`, {
        sudo,
        logStd: false,
        reject: false,
      })
      const error = exitCode !== 0 ? new Error(stderr) : null
      return { target, exitCode, error }
    },
  })
