const defaults = require("lodash/defaults")
const ctx = require("@foundernetes/ctx")
const humanizeDuration = require("@foundernetes/std/humanize-duration")

const onNewTimeoutCreate =
  (type) =>
  ({ timeout, attempts }) => {
    const logger = ctx.getLogger()
    logger.warn(
      `${type} try #${attempts} failed, will try again in ${humanizeDuration(
        timeout
      )}`
    )
  }

module.exports = (retry, type, defaultsProps = []) => {
  const config = ctx.getConfig()
  if (retry === undefined || retry === null) {
    retry = config.defaultRetry
  }
  if (typeof retry !== "object") {
    retry = {
      retries: retry,
    }
  }
  const props = {
    onNewTimeout: onNewTimeoutCreate(type),
    ...retry,
  }
  defaults(props, ...defaultsProps)
  return props
}
