const { $ } = require("@foundernetes/blueprint")

const ctx = require("@foundernetes/ctx")

const matchCondition = require("@foundernetes/match/condition")

module.exports = async (check, options = {}) => {
  const {
    logger = ctx.getLogger(),
    commandOptions = {},
    logErr = true,
  } = options

  const { command, expected, sudo } = check

  const { exitCode, message, stdout, stderr } = await $(command, {
    reject: false,
    ...commandOptions,
    ...(sudo !== undefined ? { sudo } : {}),
  })

  if (exitCode !== 0 && logErr) {
    logger.error(message)
    return false
  }

  let result
  if (check.stderr) {
    result = stderr
  } else {
    result = stdout
  }

  const isMatchingCondition = matchCondition(result, expected)
  if (!isMatchingCondition) {
    logger.debug(`expected "${JSON.stringify(expected)}" but found "${result}"`)
  }
  return isMatchingCondition
}
