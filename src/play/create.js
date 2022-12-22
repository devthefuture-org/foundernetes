const createValidator = require("~/vars/create-validator")

const FoundernetesPlayPostCheckError = require("~/error/play-post-check")
const FoundernetesPlayRunError = require("~/error/play-run")
const FoundernetesValidateVarsError = require("~/error/validate-vars")

const playbookCtx = require("~/playbook/ctx")

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

  const play = async (vars) => {
    const { middlewares } = play
    for (const middleware of middlewares) {
      if (middleware.registerContext) {
        await middleware.registerContext()
        // await middleware.registerContext({asyncLoopCtx})
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
    const counter = playbookCtx.require("counter")

    if (typeof vars === "function") {
      vars = await vars()
    }

    if (validate) {
      const isValid = await validate(vars)
      if (!isValid) {
        throw new FoundernetesValidateVarsError({ vars, validate })
      }
    }

    const preCheckResult = await preCheck(vars)
    if (!preCheckResult) {
      const runResult = await run(vars)
      if (!runResult) {
        counter.failed++
        throw new FoundernetesPlayRunError()
      }
      const postCheckResult = await postCheck(vars)
      if (!postCheckResult) {
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
  }

  play.middlewares = definition.middlewares || []
  play.use = (middleware) => {
    play.middlewares.push(middleware)
  }

  return play
}
