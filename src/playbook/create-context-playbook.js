const logError = require("~/error/log-error")
const ctx = require("~/ctx")

const defaultIterator = require("~/iterator/default-iterator")
const isAbortError = require("~/utils/is-abort-error")

const FoundernetesPlayPostCheckError = require("~/error/play-post-check")

const logPlaybook = require("./log-playbook")

module.exports = async (definition, callback) => {
  const counter = { unchanged: 0, changed: 0, failed: 0, retried: 0, total: 0 }
  // dbug(definition).k()
  const { iterators = {} } = definition

  const execPlaybook = async () =>
    ctx.fork(async () => {
      let { default: iterator } = iterators
      if (!iterator) {
        iterator = defaultIterator
      }

      const name = execPlaybook.playbookName || definition.name

      const contextPlaybook = {
        name,
        counter,
      }

      ctx.assign({
        playbook: contextPlaybook,
        iterators,
        iterator,
      })

      const logPlaybookContext = logPlaybook.start({ ...definition, name })

      let failedError
      try {
        await callback()
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

      logPlaybook.report(logPlaybookContext)

      if (failedError) {
        throw failedError
      }

      logPlaybook.end(logPlaybookContext)
    })

  Object.assign(execPlaybook, {
    iterators,
    plays: definition.plays || {},
    loaders: definition.loaders || {},
    definition,
    counter,
  })

  return execPlaybook
}
