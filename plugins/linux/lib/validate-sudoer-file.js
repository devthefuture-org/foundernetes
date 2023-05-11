const { $ } = require("@foundernetes/blueprint")

module.exports = async ({ file, ...commandOptions }) => {
  const { exitCode } = await $(`visudo -c -f ${file}`, {
    sudo: true,
    reject: false,
    logStdout: false,
    logStderr: true,
    ...commandOptions,
  })
  return exitCode === 0
}
