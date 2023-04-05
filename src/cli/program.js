const path = require("path")
const { Command } = require("commander")
const fs = require("fs-extra")

const ctx = require("~/ctx")
const loadConfig = require("~/config")
const createLogger = require("~/utils/logger-factory")
const removeExtname = require("~/utils/remove-extname")

const options = require("./options")

module.exports = () => {
  const program = new Command()

  program
    .name("foundernetes")
    .description("Infra Idempotence As A Framework ☀️")
    .version(require(`../../package.json`).version)
    .addOption(options.debug)
    .addOption(options.inlineConfig)
    .addOption(options.configSet)
    .hook("preAction", async (_thisCommand, actionCommand) => {
      const opts = actionCommand.optsWithGlobals()

      const staticDefinitions = ctx.require("staticDefinitions")
      const { inlineConfigs = [] } = staticDefinitions

      const config = await loadConfig(opts, inlineConfigs)
      ctx.set("config", config)

      const loggerOverride = ctx.get("loggerOverride")
      const { logFile } = config
      let { logFilePlain = !!logFile } = config
      if (logFile) {
        await fs.ensureFile(logFile)
      }
      if (logFile && logFilePlain) {
        if (logFilePlain === true) {
          const basename = path.basename(logFile)
          logFilePlain = path.join(
            path.dirname(logFile),
            `${removeExtname(basename)}.plain${path.extname(basename)}`
          )
        }
        await fs.ensureFile(logFilePlain)
      }
      const { logLevel, logDate, logDuration } = config
      let logger = createLogger({
        secrets: [],
        logFile,
        logFilePlain: logFile ? logFilePlain : false,
        logLevel,
        formatterOptions: {
          displayDuration: logDuration,
          displayDate: logDate,
        },
      })
      if (loggerOverride) {
        logger = loggerOverride(logger, config)
      }
      ctx.set("logger", logger)

      logger.configureDebug(opts.D)
    })

  return program
}
