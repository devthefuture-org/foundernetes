const createValidator = require("~/vars/create-validator")

const FoundernetesPlayPostCheckError = require("~/error/play-post-check")
const FoundernetesPlayRunError = require("~/error/play-run")
const FoundernetesValidateVarsError = require("~/error/validate-vars")

module.exports = async (play) => {
  const { check, run, onFail, onSuccess, onNoOp } = play

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
        throw new FoundernetesPlayRunError()
      }
      const postCheckResult = await postCheck(vars)
      if (!postCheckResult) {
        if (onFail) {
          await onFail(vars)
        }
        throw new FoundernetesPlayPostCheckError()
      } else if (onSuccess) {
        await onSuccess(vars)
      }
    } else if (onNoOp) {
      await onNoOp(vars)
    }
  }
}
