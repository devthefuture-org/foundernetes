const { setTimeout: sleep } = require("timers/promises")
const ctx = require("@foundernetes/ctx")
const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async () =>
  createPlay({
    defaultTags: ["*"],
    async check(vars, _, { isPostCheck }) {
      const {
        checkCmd,
        checkCmdOptions = {},
        sudo,
        debugCommand,
        wait,
        waitPrecheck = wait !== undefined ? wait : 0,
        waitPostCheck = wait !== undefined ? wait : 0,
      } = vars
      const checkWait = isPostCheck ? waitPostCheck : waitPrecheck
      if (checkWait) {
        await sleep(checkWait)
      }
      const { exitCode } = await $(checkCmd, {
        reject: false,
        ...(sudo !== undefined ? { sudo } : {}),
        ...checkCmdOptions,
      })

      const logger = ctx.require("logger")
      if (debugCommand && isPostCheck && exitCode !== 0) {
        const { stderr, stdout } = await $(debugCommand, {
          reject: false,
        })
        if (stderr) {
          logger.warn(stderr)
        }
        if (stdout) {
          logger.info(stdout)
        }
      }
      return exitCode === 0
    },
    async run(vars) {
      const { cmd, cmdOptions = {}, sudo } = vars
      if (!cmd) {
        return
      }
      const { exitCode } = await $(cmd, {
        reject: false,
        ...(sudo !== undefined ? { sudo } : {}),
        ...cmdOptions,
      })
      return exitCode === 0
    },
  })
