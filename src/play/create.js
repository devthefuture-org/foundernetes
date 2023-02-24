const yaRetry = require("ya-retry")

const createValidator = require("~/vars/create-validator")

const FoundernetesPlayPostCheckError = require("~/error/play-post-check")
const FoundernetesPlayRunError = require("~/error/play-run")
const FoundernetesValidateVarsError = require("~/error/validate-vars")
const FoundernetesStopError = require("~/error/stop")
const FoundernetesPlayCheckError = require("~/error/play-check")

const getPluginName = require("~/std/get-plugin-name")
const castRetry = require("~/lib/cast-retry")

const isAbortError = require("~/utils/is-abort-error")

const ctx = require("~/ctx")

module.exports = async (definition) => {
  const { check, run, before, after, onOK, onChanged, onFailed } = definition

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

      const events = ctx.require("events")
      const abortSignal = ctx.require("abortSignal")

      const retryerCreate =
        ({ type, retry, retryOnFalse, catchErrorAsFalse, func }) =>
        async () =>
          new Promise((resolve, reject) => {
            const operation = yaRetry.operation(retry)
            const stopSignal = () => {
              // const logger = ctx.require("logger")
              // logger.debug(`${type} cancel next try`)
              operation.stop()
              reject(new FoundernetesStopError())
            }
            events.on("stop", stopSignal)
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
                if (isAbortError(err)) {
                  throw err
                }
                if (
                  catchErrorAsFalse ||
                  err instanceof FoundernetesPlayCheckError
                ) {
                  if (!(err instanceof FoundernetesPlayCheckError)) {
                    hasError = true
                  }
                  results = false
                  if (type === "preCheck") {
                    logger.info(`🔀 not-ready: ${err.message}`, err.stack)
                  } else {
                    logger.warn(err, err.stack)
                  }
                } else {
                  events.off("stop", stopSignal)
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
                if (abortSignal.aborted) {
                  events.off("stop", stopSignal)
                  operation.stop()
                }
                return
              }
              events.off("stop", stopSignal)
              resolve(results)
            })
          })

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
      const beforeRetry = castRetry(definition.beforeRetry, "before", [retry])
      const afterRetry = castRetry(definition.afterRetry, "after", [retry])

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

      const beforeRetryer = retryerCreate({
        type: "before",
        catchErrorAsFalse: false,
        retry: beforeRetry,
        retryOnFalse: true,
        func: async () => (before ? before(vars) : {}),
      })
      const extraContext = await beforeRetryer()

      let preCheckResult
      try {
        const preCheckRetryer = retryerCreate({
          type: "preCheck",
          catchErrorAsFalse: catchPreCheckErrorAsFalse,
          retry: preCheckRetry,
          retryOnFalse: preCheckRetryOnFalse,
          func: async () =>
            preCheck(vars, extraContext, {
              isPreCheck: true,
              isPostCheck: false,
              event: "preCheck",
            }),
        })
        preCheckResult = await preCheckRetryer()
      } catch (error) {
        if (isAbortError(error)) {
          throw error
        }
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
          func: async () => run(vars, extraContext),
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
            func: async () =>
              postCheck(vars, extraContext, {
                isPostCheck: true,
                isPreCheck: false,
                event: "postCheck",
              }),
          })
          postCheckResult = await postCheckRetryer()
        } catch (error) {
          if (isAbortError(error)) {
            throw error
          }
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

      const afterRetryer = retryerCreate({
        type: "after",
        catchErrorAsFalse: false,
        retry: afterRetry,
        retryOnFalse: true,
        func: async () => (after ? after(vars, extraContext) : null),
      })
      await afterRetryer()
    })

  play.middlewares = [...(definition.middlewares || [])]
  play.use = (...middlewares) => {
    play.middlewares.push(...middlewares)
  }

  return play
}
