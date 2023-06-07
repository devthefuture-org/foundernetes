const { $ } = require("@foundernetes/blueprint")

module.exports = async ({ file, sudo, sudoRead = sudo }) => {
  const { stdout: actualContent } = await $(`cat ${file}`, {
    sudo: sudoRead,
    logStdout: false,
    stripFinalNewline: false,
  })
  const lines = actualContent.split("\n")
  return lines
}
