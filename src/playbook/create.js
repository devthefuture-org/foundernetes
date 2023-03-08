const chalk = require("chalk")

const logError = require("~/error/log-error")
const ctx = require("~/ctx")

const defaultIterator = require("~/iterator/default-iterator")
const isAbortError = require("~/utils/is-abort-error")

const FoundernetesPlayPostCheckError = require("~/error/play-post-check")

const logPlaybook = require("./log-playbook")

module.exports = async (definition) => {
  const counter = { ok: 0, changed: 0, failed: 0, retried: 0, total: 0 }

  const {
    playbook,
    name: playbookName,
    iterators = {},
    log: logEnabled = true,
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

      logPlaybook.start({ logEnabled, name: playbookName })

      let failedError
      try {
        await playbook()
      } catch (error) {
        if (!(error instanceof FoundernetesPlayPostCheckError)) {
          logError(error)
          if (!isAbortError(error)) {
            throw Error
          }
        } else {
          failedError = error
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

      if (failedError) {
        throw failedError
      }
    })
}
