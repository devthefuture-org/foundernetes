const pick = require("lodash.pick")
const createValidator = require("~/vars/create-validator")
const FoundernetesValidateVarsError = require("~/error/validate-vars")
const FoundernetesValidateDataError = require("~/error/validate-data")

module.exports = async (loader) => {
  const memoizationRegistry = new Map()
  const { load } = loader

  let { validateVars } = loader
  if (validateVars && typeof validateVars === "object") {
    validateVars = await createValidator(validateVars)
  }
  let { validateData } = loader
  if (validateData && typeof validateData === "object") {
    validateData = await createValidator(validateData)
  }

  return async (vars = {}) => {
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

    let { memoizeVars } = loader
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
  }
}
