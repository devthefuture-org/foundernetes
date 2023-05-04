const ctx = require("@foundernetes/ctx")

const { exitCodes } = require("~/error/constants")

module.exports = () => {
  const logger = ctx.require("logger")
  const config = ctx.require("config")
  const events = ctx.require("events")
  const abortController = new AbortController()
  const signals = ["SIGTERM", "SIGHUP", "SIGINT"]
  const { gracefullShutdownTimeout, gracefullShutdownTimeoutMs } = config
  signals.forEach((signal) => {
    process.on(signal, () => {
      if (abortController.signal.aborted) {
        if (signal === "SIGINT") {
          logger.info(`${signal} received twice, killing now`)
          process.exit(exitCodes.INTERRUPTED_KILL)
        }
        return
      }
      events.emit("stop")
      logger.info(`${signal} received, aborting...`, {
        gracefullShutdownTimeout,
      })
      abortController.abort() // if we pass argument, we can't detect AbortError anymore, so we have to let it empty
      const shutdownTimeout = setTimeout(() => {
        logger.info(`shutdown timeout reached, killing now`, {
          gracefullShutdownTimeout,
        })
        process.exit(exitCodes.INTERRUPTED_KILL)
      }, gracefullShutdownTimeoutMs)
      events.on("finish", () => {
        clearTimeout(shutdownTimeout)
      })
    })
  })
  return abortController
}
