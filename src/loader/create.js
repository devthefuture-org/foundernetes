const yaRetry = require("ya-retry")
const pick = require("lodash.pick")
const objectHash = require("object-hash")

const createValidator = require("~/vars/create-validator")

const FoundernetesValidateVarsError = require("~/error/validate-vars")
const FoundernetesValidateDataError = require("~/error/validate-data")
const FoundernetesStopError = require("~/error/stop")

const ctx = require("~/ctx")

const castRetry = require("~/lib/cast-retry")

const isAbortError = require("~/utils/is-abort-error")

const getPluginName = require("~/std/get-plugin-name")
const matchTags = require("~/std/match-tags")

const logLoader = require("./log-loader")

module.exports = async (definition) => {
  const memoizationRegistry = new Map()
  const { load } = definition

  let { validateVars } = definition
  if (validateVars && typeof validateVars === "object") {
    validateVars = await createValidator(validateVars)
  }
  let { validateData } = definition
  if (validateData && typeof validateData === "object") {
    validateData = await createValidator(validateData)
  }

  const name = getPluginName(definition, "loader")

  const retry = castRetry(definition.retry, "loader")

  const {
    retryOnUndefined = true,
    catchErrorAsUndefined = false,
    defaultTags: createDefaultTags = ["*"], // by default loaders are not filtered when using tags option
    tags: createTags = [],
  } = definition

  definition = { ...definition, name }

  const loader = async (vars = {}, options = {}) =>
    ctx.fork(async () => {
      const contextLoader = {
        name,
      }
      ctx.assign({
        loader: contextLoader,
      })

      const loadLoaderContext = logLoader.init(definition)

      const { tags: playTags = [] } = options
      const tags = [...createTags, ...playTags]
      if (tags.length === 0) {
        tags.push(...createDefaultTags)
      }
      if (!matchTags(tags, vars)) {
        return
      }

      logLoader.start(loadLoaderContext)

      if (validateVars) {
        const isValid = await validateVars(vars)
        if (!isValid) {
          throw new FoundernetesValidateVarsError({
            vars,
            validate: validateVars,
          })
        }
      }

      let { memoizeVars } = definition
      if (typeof memoizeVars === "function") {
        memoizeVars = await memoizeVars(vars)
      } else if (Array.isArray(memoizeVars)) {
        memoizeVars = pick(vars, memoizeVars)
      } else if (memoizeVars === true) {
        memoizeVars = vars
      }

      const useMemoization = memoizeVars !== undefined
      if (useMemoization) {
        const { memoizeVarsHash = true } = definition
        const memoizeVarsKey = memoizeVarsHash
          ? objectHash(memoizeVars)
          : memoizeVars
        if (memoizationRegistry.has(memoizeVarsKey)) {
          return memoizationRegistry.get(memoizeVarsKey)
        }
      }

      const operation = yaRetry.operation(retry)
      const counter = ctx.require("playbook.counter")

      const events = ctx.require("events")
      const abortSignal = ctx.require("abortSignal")

      const data = await new Promise((resolve, reject) => {
        const stopSignal = () => {
          // const logger = ctx.require("logger")
          // logger.debug(`loader cancel next try`)
          operation.stop()
          reject(new FoundernetesStopError())
        }
        events.on("stop", stopSignal)
        operation.attempt(async (currentAttempt) => {
          let results
          const logger = ctx.require("logger")
          if (currentAttempt > 1) {
            logger.debug(`loader try #${currentAttempt}`)
            counter.retried++
          }
          let hasError
          try {
            results = await load(vars)
            hasError = false
          } catch (err) {
            if (isAbortError(err)) {
              throw err
            }
            if (catchErrorAsUndefined) {
              hasError = true
              results = false
              logger.warn(err, err.stack)
            } else {
              events.off("stop", stopSignal)
              reject(err)
              return
            }
            events.off("stop", stopSignal)
            reject(err)
            return
          }
          let err
          if (retryOnUndefined) {
            err = results === undefined ? true : null
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

      if (validateData) {
        const isValid = await validateData(data)
        if (!isValid) {
          throw new FoundernetesValidateDataError({
            vars,
            validate: validateData,
          })
        }
      }

      if (useMemoization) {
        memoizationRegistry.set(memoizeVars, data)
      }

      logLoader.end(loadLoaderContext)

      return data
    })
  return loader
}
