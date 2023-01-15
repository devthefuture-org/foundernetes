const humanizeDuration = require("~/lib/humanize-duration")

const ctx = require("~/ctx")

const onNewTimeoutCreate =
  (type) =>
  ({ timeout, attempts }) => {
    const logger = ctx.require("logger")
    logger.warn(
      `${type} try #${attempts} failed, will try again in ${humanizeDuration(
        timeout
      )}`
    )
  }

module.exports = (retry, type, defaults = []) => {
  const config = ctx.require("config")
  if (retry === undefined || retry === null) {
    retry = config.defaultRetry
  }
  if (typeof retry !== "object") {
    retry = {
      retries: retry,
    }
  }
  return {
    ...defaults,
    onNewTimeout: onNewTimeoutCreate(type),
    ...retry,
  }
}
