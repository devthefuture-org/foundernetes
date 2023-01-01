const yaRetry = require("ya-retry")

const humanizeDuration = require("~/lib/humanize-duration")

const createValidator = require("~/vars/create-validator")

const FoundernetesPlayPostCheckError = require("~/error/play-post-check")
const FoundernetesPlayRunError = require("~/error/play-run")
const FoundernetesValidateVarsError = require("~/error/validate-vars")

const getPluginName = require("~/std/get-plugin-name")

const ctx = require("~/ctx")

module.exports = async (definition) => {
  const { check, run, onOK, onChanged, onFailed } = definition

  let { preCheck, postCheck } = definition
  if (!preCheck) {
    preCheck = check
  }
  if (!postCheck) {
    postCheck = check
  }

  let { validate } = definition
  if (validate && typeof validate === "object") {
    validate = await createValidator(validate)
  }

  const name = getPluginName(definition, "play")

  const config = ctx.require("config")

  const play = async (vars) =>
    ctx.fork(async () => {
      const contextPlay = {
        name,
      }

      ctx.assign({
        play: contextPlay,
      })

      const { middlewares } = play
      for (const middleware of middlewares) {
        if (middleware.hook) {
          await middleware.hook(contextPlay, "play")
        }
      }

      for (const middleware of middlewares) {
        if (middleware.vars) {
          const result = middleware.vars(vars)
          if (result) {
            vars = result
          }
        }
      }
      const counter = ctx.require("playbook.counter")

      if (typeof vars === "function") {
        vars = await vars()
      }

      if (validate) {
        const isValid = await validate(vars)
        if (!isValid) {
          throw new FoundernetesValidateVarsError({ vars, validate })
        }
      }

      let { retry } = definition
      if (retry === undefined || retry === null) {
        retry = config.defaultRetry
      }
      if (typeof retry !== "object") {
        retry = {
          retries: retry,
        }
      }
      const onNewTimeout = ({ timeout, attempts }) => {
        const logger = ctx.require("logger")
        logger.warn(
          `try #${attempts} failed, will try again in ${humanizeDuration(
            timeout
          )}`
        )
      }
      retry = {
        onNewTimeout,
        ...retry,
      }
      const { catchRunErrorAsFalse = true } = definition

      const preCheckResult = await preCheck(vars)
      if (preCheckResult === false) {
        const retryer = async () => {
          const operation = yaRetry.operation(retry)
          return new Promise((resolve, reject) => {
            operation.attempt(async (currentAttempt) => {
              let results
              const logger = ctx.require("logger")
              if (currentAttempt > 1) {
                logger.debug(`try #${currentAttempt}`)
              }
              try {
                results = await run(vars)
              } catch (err) {
                if (catchRunErrorAsFalse) {
                  results = false
                } else {
                  reject(err)
                  return
                }
              }
              const err = results === false ? null : true
              if (operation.retry(err)) {
                if (currentAttempt > 1) {
                  counter.retried++
                }
                return
              }

              resolve(results)
            })
          })
        }
        const runResult = await retryer()
        if (runResult === false) {
          counter.failed++
          throw new FoundernetesPlayRunError()
        }
        const postCheckResult = await postCheck(vars)
        if (postCheckResult === false) {
          counter.failed++
          if (onFailed) {
            await onFailed(vars)
          }
          throw new FoundernetesPlayPostCheckError()
        } else {
          counter.changed++
          if (onChanged) {
            await onChanged(vars)
          }
        }
      } else {
        counter.ok++
        if (onOK) {
          await onOK(vars)
        }
      }
    })

  play.middlewares = [...definition.middlewares] || []
  play.use = (middleware) => {
    play.middlewares.push(middleware)
  }

  return play
}
