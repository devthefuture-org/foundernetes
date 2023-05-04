const isAbortError = require("@foundernetes/std/is-abort-error")
const ctx = require("@foundernetes/ctx")
const logError = require("~/error/log-error")

const defaultIterator = require("~/iterator/default-iterator")

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
      let playingError
      try {
        await callback()
      } catch (error) {
        if (!(error instanceof FoundernetesPlayPostCheckError)) {
          if (!isAbortError(error)) {
            logError(error)
            playingError = error
          }
        } else {
          logError(error)
          failedError = error
        }
      }

      logPlaybook.report(logPlaybookContext)

      if (playingError) {
        throw playingError
      }
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
