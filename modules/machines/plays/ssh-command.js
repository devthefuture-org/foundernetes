const shellQuote = require("shell-quote")

const ctx = require("@foundernetes/ctx")
const { createComposer } = require("@foundernetes/blueprint")
const deepmerge = require("@foundernetes/std/deepmerge")

module.exports = async () => {
  return createComposer(async (vars) => {
    let { command, ...commandOptions } = vars
    const ssh = ctx.require("ssh")
    const logger = ctx.require("logger")
    commandOptions = deepmerge({}, commandOptions)
    if (Array.isArray(command)) {
      command = shellQuote.quote(command)
    }
    logger.info(`▶️  ${command} ...`)
    let result
    if (command.startsWith("sudo ")) {
      result = await ssh.execCommandSudo(command, commandOptions)
    } else {
      result = await ssh.execCommand(command, commandOptions)
    }
    const { code, stdout, stderr } = result
    if (stdout) {
      logger.debug(`${stdout}`, { command, code })
    }
    if (stderr) {
      logger.debug(`${stderr}`, { command, code })
    }
    if (code === 0) {
      logger.info(`☑️  ${command}`)
    } else {
      logger.error(`❗ exit code ${code}`, {
        command,
        code,
        stdout,
        stderr,
      })
    }
  })
}
