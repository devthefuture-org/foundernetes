const { $ } = require("@foundernetes/blueprint")

module.exports = async (file, { sudo } = {}) => {
  const { exitCode: existExitCode } = await $(`test -e ${file}`, {
    sudo,
    logStd: false,
    reject: false,
  })
  return existExitCode === 0
}
