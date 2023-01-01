const chalk = require("chalk")

const logError = require("~/error/log-error")
const ctx = require("~/ctx")

const defaultIterator = require("~/iterator/default-iterator")
const isAbortError = require("~/utils/is-abort-error")

module.exports = async (definition) => {
  const counter = { ok: 0, changed: 0, failed: 0, retried: 0, total: 0 }

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

      const contextPlaybook = {
        name: playbookName,
        counter,
      }

      ctx.assign({
        playbook: contextPlaybook,
        iterators,
        iterator,
      })

      try {
        for (const middleware of middlewares) {
          if (middleware.hook) {
            await middleware.hook(contextPlaybook, "playbook")
          }
        }
        await playbook()
      } catch (error) {
        logError(error)
        if (!isAbortError(error)) {
          throw Error
        }
      }

      const msg = `report: ${chalk.green(
        `OK=${counter.ok}`
      )} ${chalk.cyanBright(`Changed=${counter.changed}`)} ${chalk.red(
        `Failed=${counter.failed}`
      )} ${
        counter.retried > 0 ? chalk.yellow(`Retried=${counter.retried}`) : ""
      }`
      const logger = ctx.require("logger")
      logger.info(msg)
    })
}
