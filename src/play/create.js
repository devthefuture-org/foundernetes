const yaRetry = require("ya-retry")

const createValidator = require("~/vars/create-validator")

const FoundernetesPlayPostCheckError = require("~/error/play-post-check")
const FoundernetesPlayRunError = require("~/error/play-run")
const FoundernetesValidateVarsError = require("~/error/validate-vars")

const getPluginName = require("~/std/get-plugin-name")
const castRetry = require("~/lib/cast-retry")

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

      const retryerCreate =
        ({ type, retry, retryOnFalse, catchErrorAsFalse, func }) =>
        async () => {
          const operation = yaRetry.operation(retry)
          return new Promise((resolve, reject) => {
            operation.attempt(async (currentAttempt) => {
              let results
              const logger = ctx.require("logger")
              if (currentAttempt > 1) {
                logger.debug(`${type} try #${currentAttempt}`)
                counter.retried++
              }
              let hasError
              try {
                results = await func()
                hasError = false
              } catch (err) {
                if (catchErrorAsFalse) {
                  hasError = true
                  results = false
                  logger.warn(err)
                } else {
                  reject(err)
                  return
                }
              }
              let err
              if (retryOnFalse) {
                err = results === false ? true : null
              } else {
                err = hasError === true ? true : null
              }
              if (operation.retry(err)) {
                return
              }

              resolve(results)
            })
          })
        }

      const retry = castRetry(definition.retry, "run")
      const checkRetry = castRetry(definition.checkRetry, "check")
      const postCheckRetry = castRetry(definition.postCheckRetry, "postCheck", [
        retry,
        checkRetry,
      ])
      const preCheckRetry = castRetry(definition.preCheckRetry, "preCheck", [
        retry,
        checkRetry,
      ])

      const {
        runRetryOnFalse = true,
        preCheckRetryOnFalse = false,
        postCheckRetryOnFalse = false,
      } = definition

      const {
        catchRunErrorAsFalse = true,
        catchCheckErrorAsFalse = true,
        catchPreCheckErrorAsFalse = catchCheckErrorAsFalse,
        catchPostCheckErrorAsFalse = catchCheckErrorAsFalse,
        continueOnRunError = false,
      } = definition

      let preCheckResult
      try {
        const preCheckRetryer = retryerCreate({
          type: "preCheck",
          catchErrorAsFalse: catchPreCheckErrorAsFalse,
          retry: preCheckRetry,
          retryOnFalse: preCheckRetryOnFalse,
          func: async () => preCheck(vars),
        })
        preCheckResult = await preCheckRetryer()
      } catch (error) {
        if (catchCheckErrorAsFalse) {
          preCheckResult = false
          const logger = ctx.require("logger")
          logger.error(error)
        } else {
          throw error
        }
      }

      if (preCheckResult === false) {
        const runRetryer = retryerCreate({
          type: "run",
          catchErrorAsFalse: catchRunErrorAsFalse,
          retry,
          retryOnFalse: runRetryOnFalse,
          func: async () => run(vars),
        })
        const runResult = await runRetryer()
        if (runResult === false) {
          counter.failed++
          throw new FoundernetesPlayRunError()
        }

        let postCheckResult
        try {
          const postCheckRetryer = retryerCreate({
            type: "postCheck",
            catchErrorAsFalse: catchPostCheckErrorAsFalse,
            retry: postCheckRetry,
            retryOnFalse: postCheckRetryOnFalse,
            func: async () => postCheck(vars),
          })
          postCheckResult = await postCheckRetryer
        } catch (error) {
          if (catchCheckErrorAsFalse) {
            postCheckResult = false
            const logger = ctx.require("logger")
            logger.error(error)
          } else {
            throw error
          }
        }
        if (postCheckResult === false) {
          counter.failed++
          if (onFailed) {
            await onFailed(vars)
          }
          if (!continueOnRunError) {
            throw new FoundernetesPlayPostCheckError()
          }
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
