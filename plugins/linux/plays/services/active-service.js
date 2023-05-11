const { setTimeout: sleep } = require("timers/promises")
const ctx = require("@foundernetes/ctx")
const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async () =>
  createPlay({
    async check(vars, _, { isPostCheck }) {
      const {
        name,
        wait,
        waitPrecheck = wait !== undefined ? wait : 0,
        waitPostCheck = wait !== undefined ? wait : 0,
      } = vars
      const checkWait = isPostCheck ? waitPostCheck : waitPrecheck
      if (checkWait) {
        await sleep(checkWait)
      }
      const { exitCode } = await $(`systemctl is-active --quiet ${name}`, {
        reject: false,
      })

      const logger = ctx.getLogger()
      if (isPostCheck && exitCode !== 0) {
        const { stderr, stdout } = await $(`systemctl status ${name}`, {
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
      const { name } = vars
      const { exitCode } = await $(`systemctl start ${name}`, {
        reject: false,
        sudo: true,
      })
      return exitCode === 0
    },
  })
