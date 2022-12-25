const chalk = require("chalk")

const logError = require("~/error/log-error")
const ctx = require("~/ctx")

const defaultIterator = require("~/iterator/default-iterator")

module.exports = async (definition) => {
  const counter = { ok: 0, changed: 0, failed: 0, total: 0 }

  const {
    playbook,
    middlewares = [],
    name: playbookName,
    iterators = {},
  } = definition

  return async () =>
    ctx.fork(async () => {
      let { default: iterator } = iterators
      if (!iterator) {
        iterator = defaultIterator
      }

      ctx.assign({
        playbook: {
          name: playbookName,
          counter,
        },
        iterators,
        iterator,
      })

      try {
        for (const middleware of middlewares) {
          if (middleware.hook) {
            await middleware.hook(playbook)
          }
        }
        await playbook()
      } catch (error) {
        logError(error)
      }

      const msg = `report: ${chalk.green(
        `OK=${counter.ok}`
      )} ${chalk.cyanBright(`Changed=${counter.changed}`)} ${chalk.red(
        `Failed=${counter.failed}`
      )}`
      const logger = ctx.require("logger")
      logger.info(msg)
    })
}
