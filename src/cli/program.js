const { Command } = require("commander")

const ctx = require("~/ctx")
const loadConfig = require("~/config")
const createLogger = require("~/utils/logger-factory")
const globalLogger = require("~/utils/logger")
const options = require("./options")

module.exports = () => {
  const program = new Command()

  program
    .name("foundernetes")
    .description("Infra Idempotence As A Framework ☀️")
    .version(require(`${__dirname}/../../package.json`).version)
    .addOption(options.debug)
    .addOption(options.inlineConfig)
    .addOption(options.configSet)
    .hook("preAction", async (_thisCommand, actionCommand) => {
      const opts = actionCommand.optsWithGlobals()

      const config = await loadConfig(opts)
      ctx.set("config", config)

      const loggerOverride = ctx.get("loggerOverride")
      let logger = createLogger({
        sync: false,
        secrets: [],
      })
      if (loggerOverride) {
        logger = loggerOverride(logger, config)
      }
      ctx.set("logger", logger)

      logger.configureDebug(opts.D)
      globalLogger.configureDebug(opts.D)
    })

  return program
}
