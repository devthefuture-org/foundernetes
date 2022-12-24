const pick = require("lodash.pick")

const createValidator = require("~/vars/create-validator")
const FoundernetesValidateVarsError = require("~/error/validate-vars")
const FoundernetesValidateDataError = require("~/error/validate-data")
const ctx = require("~/ctx")

const getPluginName = require("~/std/get-plugin-name")

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

  const loader = async (vars = {}) =>
    ctx.fork(async () => {
      const name = getPluginName(definition, "loader")

      ctx.replace("logger", (log) => log.child({ loader: name }))

      const { middlewares } = loader
      for (const middleware of middlewares) {
        if (middleware.hook) {
          await middleware.hook(loader)
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
      if (typeof vars === "function") {
        vars = await vars()
      }

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
      if (useMemoization && memoizationRegistry.has(memoizeVars)) {
        return memoizationRegistry.get(memoizeVars)
      }

      const data = await load(vars)

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

      return data
    })

  loader.middlewares = definition.middlewares || []
  loader.use = (middleware) => {
    loader.middlewares.push(middleware)
  }

  return loader
}
