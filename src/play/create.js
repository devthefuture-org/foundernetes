const yaRetry = require("ya-retry")
const chalk = require("chalk")
const objectHash = require("object-hash")
const createValidator = require("~/vars/create-validator")

const FoundernetesPlayPostCheckError = require("~/error/play-post-check")
const FoundernetesPlayRunError = require("~/error/play-run")
const FoundernetesValidateVarsError = require("~/error/validate-vars")
const FoundernetesStopError = require("~/error/stop")
const FoundernetesPlayCheckError = require("~/error/play-check")

const getPluginName = require("~/std/get-plugin-name")
const conditions = require("~/std/conditions")
const matchTags = require("~/std/match-tags")
const mergeTags = require("~/std/merge-tags")

const castRetry = require("~/lib/cast-retry")

const isAbortError = require("~/utils/is-abort-error")

const ctx = require("~/ctx")
const unsecureRandomUid = require("~/utils/unsecure-random-uid")
const logPlay = require("./log-play")

const castArrayAsFunction = require("./cast-array-as-function")

module.exports = async (definition) => {
  const {
    check,
    before,
    after,
    onOK,
    onChanged,
    onFailed,
    factoryTags = [],
    defaultTags: createDefaultTags = [],
    tags: createTags = [],
    if: createIfConditions = [],
  } = definition

  let { run } = definition

  let { preCheck, postCheck } = definition
  if (!preCheck) {
    preCheck = check
  }
  if (!postCheck) {
    postCheck = check
  }

  preCheck = castArrayAsFunction(preCheck)
  postCheck = castArrayAsFunction(postCheck)
  run = castArrayAsFunction(run)

  let { validate } = definition
  if (validate && typeof validate === "object") {
    validate = await createValidator(validate)
  }

  const play = async (vars = {}, options = {}) =>
    ctx.fork(async () => {
      const name = getPluginName(definition, play)
      definition = { ...definition, name }

      const contextPlay = {
        name,
      }

      ctx.assign({
        play: contextPlay,
      })

      const logPlayContext = logPlay.init(definition)

      const { tags: playTags = [] } = options
      const tags = await mergeTags({
        factoryTags,
        createDefaultTags,
        createTags,
        playTags,
      })
      if (!matchTags(tags, vars)) {
        return
      }
      if (
        !(await conditions(
          [...createIfConditions, ...(play.if || []), ...(options.if || [])],
          {
            func: play,
            name,
            tags,
            vars,
          }
        ))
      ) {
        return
      }

      logPlay.start(logPlayContext)

      const counter = ctx.require("playbook.counter")

      const {
        itemKey = "name",
        itemNameFallback = "hash",
        itemNameFallbackTruncLength = 7,
        itemName: itemNameOption = (itemVars) => {
          let itemName = itemVars[itemKey]
          if (itemName === undefined) {
            switch (itemNameFallback) {
              case "random": {
                itemName = unsecureRandomUid()
                break
              }
              case "hash": {
                itemName = objectHash(vars)
                break
              }
              default:
            }
            if (typeof itemName === "string") {
              itemName = itemName.slice(0, itemNameFallbackTruncLength)
            }
          }
          return itemName
        },
      } = play
      const itemName = itemNameOption(vars)

      if (validate) {
        const isValid = await validate(vars)
        if (!isValid) {
          throw new FoundernetesValidateVarsError({ vars, validate })
        }
      }

      const events = ctx.require("events")
      const abortSignal = ctx.require("abortSignal")

      const retryerCreate =
        ({
          type,
          retry,
          retryOnFalse,
          retryOnError,
          catchErrorAsFalse,
          func,
        }) =>
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
                  if (type !== "preCheck") {
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
                err = hasError === true && retryOnError ? true : null
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
        retryOnFalse = true,
        runRetryOnFalse = retryOnFalse,
        preCheckRetryOnFalse = retryOnFalse,
        postCheckRetryOnFalse = retryOnFalse,
        beforeRetryOnFalse = retryOnFalse,
        afterRetryOnFalse = retryOnFalse,
        retryOnError = false,
        runRetryOnError = retryOnError,
        preCheckRetryOnError = retryOnError,
        postCheckRetryOnError = retryOnError,
        beforeRetryOnError = retryOnError,
        afterRetryOnError = retryOnError,
      } = definition

      const {
        catchRunErrorAsFalse = false,
        catchCheckErrorAsFalse = false,
        catchPreCheckErrorAsFalse = catchCheckErrorAsFalse,
        catchPostCheckErrorAsFalse = catchCheckErrorAsFalse,
        continueOnRunError = false,
      } = definition

      const beforeRetryer = retryerCreate({
        type: "before",
        catchErrorAsFalse: false,
        retry: beforeRetry,
        retryOnFalse: beforeRetryOnFalse,
        retryOnError: beforeRetryOnError,
        func: async () => (before ? before(vars) : {}),
      })
      const extraContext = await beforeRetryer()

      const logger = ctx.require("logger")

      let preCheckResult
      try {
        const preCheckRetryer = retryerCreate({
          type: "preCheck",
          catchErrorAsFalse: catchPreCheckErrorAsFalse,
          retry: preCheckRetry,
          retryOnFalse: preCheckRetryOnFalse,
          retryOnError: preCheckRetryOnError,
          func: async () => {
            const event = {
              isPreCheck: true,
              isPostCheck: false,
              event: "preCheck",
            }
            return preCheck(vars, extraContext, event)
          },
        })
        logger.info(`🕵️  ${chalk.blueBright(`[${itemName}] pre-checking ...`)}`)
        preCheckResult = await preCheckRetryer()
      } catch (error) {
        if (isAbortError(error)) {
          throw error
        }
        if (catchCheckErrorAsFalse) {
          preCheckResult = false
          logger.error(error)
        } else {
          throw error
        }
      }

      if (preCheckResult === false) {
        logger.info(`🙀 ${chalk.cyanBright(`[${itemName}] checked not-ready`)}`)
        const runRetryer = retryerCreate({
          type: "run",
          catchErrorAsFalse: catchRunErrorAsFalse,
          retry,
          retryOnFalse: runRetryOnFalse,
          retryOnError: runRetryOnError,
          func: async () => run(vars, extraContext),
        })
        logger.info(`🏃 ${chalk.cyanBright(`[${itemName}] running ...`)}`)
        const runResult = await runRetryer()
        logger.info(`🔚 ${chalk.cyanBright(`[${itemName}] ran`)}`)
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
            retryOnError: postCheckRetryOnError,
            func: async () => {
              const event = {
                isPostCheck: true,
                isPreCheck: false,
                event: "postCheck",
              }
              return postCheck(vars, extraContext, event)
            },
          })
          logger.info(
            `🕵️  ${chalk.cyanBright(`[${itemName}] post-checking ...`)}`
          )
          postCheckResult = await postCheckRetryer()
        } catch (error) {
          if (isAbortError(error)) {
            throw error
          }
          if (catchCheckErrorAsFalse) {
            postCheckResult = false
            logger.error(error)
          } else {
            throw error
          }
        }
        if (postCheckResult === false) {
          logger.info(`❌ ${chalk.red(`[${itemName}] failed`)}`)
          logger.debug(`[${itemName}] failed`, { vars })
          counter.failed++
          if (onFailed) {
            await onFailed(vars)
          }
          if (!continueOnRunError) {
            throw new FoundernetesPlayPostCheckError()
          }
        } else {
          logger.info(`✅ ${chalk.cyanBright(`[${itemName}] checked ready`)}`)
          counter.changed++
          if (onChanged) {
            await onChanged(vars)
          }
        }
      } else {
        logger.info(`✅ ${chalk.green(`[${itemName}] checked ready`)}`)
        counter.unchanged++
        if (onOK) {
          await onOK(vars)
        }
      }

      const afterRetryer = retryerCreate({
        type: "after",
        catchErrorAsFalse: false,
        retry: afterRetry,
        retryOnFalse: afterRetryOnFalse,
        retryOnError: afterRetryOnError,
        func: async () => (after ? after(vars, extraContext) : null),
      })
      await afterRetryer()

      logPlay.end(logPlayContext)
    })

  return play
}
