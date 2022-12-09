const createValidator = require("~/vars/create-validator")

const FoundernetesPlayPostCheckError = require("~/error/play-post-check")
const FoundernetesPlayRunError = require("~/error/play-run")
const FoundernetesValidateVarsError = require("~/error/validate-vars")

const playbookCtx = require("~/playbook/ctx")

module.exports = async (play) => {
  const { check, run, onOK, onChanged, onFailed } = play

  let { preCheck, postCheck } = play
  if (!preCheck) {
    preCheck = check
  }
  if (!postCheck) {
    postCheck = check
  }

  let { validate } = play
  if (validate && typeof validate === "object") {
    validate = await createValidator(validate)
  }

  return async (vars) => {
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
}
