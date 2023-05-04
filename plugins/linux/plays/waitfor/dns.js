const dns = require("dns/promises")
const { setTimeout: sleep } = require("timers/promises")

const ctx = require("@foundernetes/ctx")
const yaRetry = require("ya-retry")

module.exports = async () => {
  return async () => {
    const logger = ctx.require("logger")
    await yaRetry(
      async (_bail) => {
        try {
          await dns.lookup("cloudflare.com")
          logger.debug("dns ready")
        } catch (error) {
          logger.debug("waiting for dns...")
          await sleep(1000)
          throw new Error("dns lookup failed")
        }
      },
      {
        retries: 10,
      }
    )
  }
}
