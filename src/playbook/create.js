const chalk = require("chalk")

const logError = require("~/error/log-error")
const ctx = require("~/ctx")

const playbookCtx = require("./ctx")

module.exports = async (definition) => {
  const counter = { ok: 0, changed: 0, failed: 0, total: 0 }

  const { playbook, middlewares = [], name: playbookName } = definition

  return async () => {
    const logger = ctx.require("logger")
    const playbookLogger = logger.child({ playbookName })

    playbookCtx.assign({
      counter,
      playbookName,
      logger: playbookLogger,
    })

    for (const middleware of middlewares) {
      if (middleware.registerContext) {
        await middleware.registerContext()
      }
    }

    try {
      await playbook()
    } catch (error) {
      logError(playbookLogger, error)
    }
    const msg = `report: ${chalk.green(`OK=${counter.ok}`)} ${chalk.cyanBright(
      `Changed=${counter.changed}`
    )} ${chalk.red(`Failed=${counter.failed}`)}`
    playbookLogger.info(msg)
  }
}
