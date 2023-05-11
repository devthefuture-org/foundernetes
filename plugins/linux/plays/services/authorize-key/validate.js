const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async () =>
  createPlay({
    async check(vars) {
      const { file = "-", ...commandOptions } = vars
      const { exitCode } = $(`ssh-keygen -lf ${file}`, {
        logStdout: true,
        logStderr: true,
        ...commandOptions,
      })
      return exitCode === 0
    },
  })
