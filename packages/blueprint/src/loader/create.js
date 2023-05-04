const yaRetry = require("ya-retry")
const pick = require("lodash.pick")
const objectHash = require("object-hash")

const isAbortError = require("@foundernetes/std/is-abort-error")
const ctx = require("@foundernetes/ctx")
const createValidator = require("~/vars/create-validator")

const FoundernetesValidateVarsError = require("~/error/validate-vars")
const FoundernetesValidateDataError = require("~/error/validate-data")
const FoundernetesStopError = require("~/error/stop")

const castRetry = require("~/lib/cast-retry")

const getPluginName = require("~/std/get-plugin-name")
const conditions = require("~/std/conditions")
const matchTags = require("~/std/match-tags")
const mergeTags = require("~/std/merge-tags")

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

  const retry = castRetry(definition.retry, "loader")

  const {
    retryOnUndefined = true,
    catchErrorAsUndefined = false,
    factoryTags = [],
    defaultTags: createDefaultTags = ["*"], // by default loaders are not filtered when using tags option
    tags: createTags = [],
    if: createIfConditions = [],
  } = definition

  const {
    memoizeVarsHash = true,
    cache: defaultCache,
    cacheable = defaultCache,
    cacheKey = "cache",
  } = definition

  const loader = async (vars = {}, options = {}) =>
    ctx.fork(async () => {
      const name = getPluginName(definition, loader)
      definition = { ...definition, name }

      const contextLoader = {
        name,
      }
      ctx.assign({
        loader: contextLoader,
      })

      const loadLoaderContext = logLoader.init(definition)

      const { tags: playTags = [] } = options
      const tags = await mergeTags({
        func: loader,
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
          [...createIfConditions, ...(loader.if || []), ...(options.if || [])],
          {
            func: loader,
            name,
            tags,
            vars,
          }
        ))
      ) {
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
      }
      if (Array.isArray(memoizeVars)) {
        memoizeVars = pick(vars, memoizeVars)
      } else if (memoizeVars === true) {
        memoizeVars = vars
      }

      if (cacheable) {
        const cache =
          cacheKey && vars[cacheKey] !== undefined
            ? vars[cacheKey]
            : defaultCache
        if (cache) {
          if (memoizeVars === undefined) {
            memoizeVars = vars
          }
        }
      }

      const useMemoization = memoizeVars !== undefined
      const memoizeVarsKey =
        useMemoization && memoizeVarsHash
          ? objectHash(memoizeVars)
          : memoizeVars

      if (useMemoization) {
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
        memoizationRegistry.set(memoizeVarsKey, data)
      }

      logLoader.end(loadLoaderContext)

      return data
    })

  loader.clearCache = (memoizeVars) => {
    if (typeof memoizeVars !== "object" || memoizeVars === null) {
      memoizationRegistry.clear()
      return
    }

    const memoizeVarsKey = memoizeVarsHash
      ? objectHash(memoizeVars)
      : memoizeVars

    if (memoizationRegistry.has(memoizeVarsKey)) {
      memoizationRegistry.delete(memoizeVarsKey)
    }
  }

  return loader
}
