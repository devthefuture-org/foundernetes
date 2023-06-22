const path = require("path")
const { Command } = require("commander")
const fs = require("fs-extra")

const createLogger = require("@foundernetes/std/logger-factory")
const removeExtname = require("@foundernetes/std/remove-extname")
const ctx = require("@foundernetes/ctx")
const loadConfig = require("~/config")

const options = require("./options")

module.exports = async (projectConfig) => {
  const program = new Command()

  const { cliPlugins = [] } = projectConfig

  program
    .name("foundernetes")
    .description("Infra Idempotence As A Framework ☀️")
    .version(require(`../../package.json`).version)
    .addOption(options.debug)
    .addOption(options.inlineConfig)
    .addOption(options.configSet)
    .hook("preAction", async (_thisCommand, actionCommand) => {
      const opts = actionCommand.optsWithGlobals()

      const { inlineConfigs = [] } = projectConfig

      let config = await loadConfig(opts, inlineConfigs)
      for (const plugin of cliPlugins) {
        if (plugin.config) {
          config = await plugin.config(config, opts, inlineConfigs)
        }
      }
      ctx.setConfig(config)

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
      ctx.setLogger(logger)

      logger.configureDebug(opts.D)
    })

  return program
}
