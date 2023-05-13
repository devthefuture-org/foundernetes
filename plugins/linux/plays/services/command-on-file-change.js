const { $ } = require("@foundernetes/blueprint")

const onFileChangeFacts = require("~/plays/std-factories/on-file-change-facts")

module.exports = async (deps) => {
  const run = async (vars) => {
    const { command, commandOptions = {} } = vars
    $(command, { ...commandOptions })
  }

  const play = { run }

  return onFileChangeFacts({ ...deps, play })
}
