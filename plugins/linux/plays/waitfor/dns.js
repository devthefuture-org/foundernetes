const dns = require("dns/promises")
const { setTimeout: sleep } = require("timers/promises")

const { createComposer } = require("@foundernetes/blueprint")
const ctx = require("@foundernetes/ctx")
const yaRetry = require("ya-retry")

module.exports = async () => {
  return createComposer(async () => {
    const logger = ctx.getLogger()
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
  })
}
