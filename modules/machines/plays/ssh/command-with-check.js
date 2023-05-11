const shellQuote = require("shell-quote")
const ctx = require("~/ctx")
const commandFactory = require("~/plays/ssh-factories/command")

module.exports = async (deps) => {
  const check = async (vars) => {
    let { check: checkDef } = vars
    if (typeof checkDef === "string" || Array.isArray(checkDef)) {
      checkDef = { command: checkDef }
    }

    let { command } = checkDef
    if (Array.isArray(command)) {
      command = shellQuote.quote(command)
    }
    const ssh = ctx.getSSH()
    const { code } = await ssh.execCommand(command)
    return code === 0
  }

  return commandFactory({ ...deps, check })
}
