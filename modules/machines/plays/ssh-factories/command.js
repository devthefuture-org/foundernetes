const omit = require("lodash/omit")

const shellQuote = require("shell-quote")
const { createPlay } = require("@foundernetes/blueprint")
const deepmerge = require("@foundernetes/std/deepmerge")
const ctx = require("~/ctx")

module.exports = async ({ check }) => {
  return createPlay({
    check,
    async run(vars) {
      let commandOptions = omit(vars, [
        "command",
        "logStd",
        "logStderr",
        "logStdout",
      ])

      const ssh = ctx.getSSH()

      const logger = ctx.getLogger()

      const {
        logStd = true,
        logStderr = logStd,
        logStdout = logStd,
        logStdOnError = false,
        logStdoutOnError = logStdOnError,
        logStderrOnError = logStdOnError,
        logWrap = true,
        logNewLine = false,
      } = vars

      let { command } = vars
      if (Array.isArray(command)) {
        command = shellQuote.quote(command)
      }

      commandOptions = deepmerge(
        {
          onStderr: (chunk) => {
            if (logStderr) {
              if (logWrap) {
                logger.info(chunk.toString(), { command })
              } else {
                process.stderr.write(
                  chunk.toString() + (logNewLine ? "\n" : "")
                )
              }
            }
          },
          onStdout: (chunk) => {
            if (logStdout) {
              if (logWrap) {
                logger.info(chunk.toString(), { command })
              } else {
                process.stderr.write(
                  chunk.toString() + (logNewLine ? "\n" : "")
                )
              }
            }
          },
        },
        commandOptions
      )

      logger.info(`▶️  ${command} ...`)
      let result
      if (command.sudo && !command.startsWith("sudo ")) {
        command = `sudo ${command}`
      }
      if (command.startsWith("sudo ")) {
        result = await ssh.execCommandSudo(command, commandOptions)
      } else {
        result = await ssh.execCommand(command, commandOptions)
      }
      const { code, stdout, stderr } = result
      if (code === 0) {
        logger.info(`☑️  ${command}`)
      } else {
        logger.error(`❗ exit code ${code}`, {
          command,
          code,
          ...(logStdoutOnError ? { stdout } : {}),
          ...(logStderrOnError ? { stderr } : {}),
        })
        return false
      }
    },
  })
}
