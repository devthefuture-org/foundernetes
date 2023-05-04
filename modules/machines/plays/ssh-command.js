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
    if (typeof command === "string") {
      command = shellQuote.parse(command)
    }
    const commandStr = shellQuote.quote(command)
    const [cmd, ...args] = command
    logger.info(`▶️  ${commandStr} ...`)
    const { code, stdout, stderr } = await ssh.exec(cmd, args, commandOptions)
    if (stdout) {
      logger.debug(`${stdout}`, { command: commandStr, code })
    }
    if (stderr) {
      logger.debug(`${stderr}`, { command: commandStr, code })
    }
    if (code === 0) {
      logger.info(`☑️  ${commandStr}`)
    } else {
      logger.error(`❗ exit code ${code}`, {
        command: commandStr,
        code,
        stdout,
        stderr,
      })
    }
  })
}
