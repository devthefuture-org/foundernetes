const commandFactory = require("~/plays/ssh-factories/command")

module.exports = async (deps) => {
  return commandFactory(deps)
}
