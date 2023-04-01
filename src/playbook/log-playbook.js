const chalk = require("chalk")

const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const setIndentationContext = require("~/log/set-context-indentation")
const timeLogger = require("~/utils/time-logger")

const start = (definition) => {
  const elapsed = timeLogger()
  const logPlaybookContext = { ...definition, elapsed }
  const { log = true, name } = definition
  ctx.set("parentLogger", ctx.require("logger"))
  if (!log) {
    return logPlaybookContext
  }
  setIndentationContext.incr()
  const logger = ctx.replace("logger", (l) =>
    l.child(
      {
        playbook: name,
      },
      getContextLoggerOptions()
    )
  )
  logger.info(`📖 launching playbook: ${name}`)
  return logPlaybookContext
}

const end = ({ log = true, name, elapsed }) => {
  if (!log) {
    return false
  }
  const logger = ctx.require("parentLogger")
  logger.info(`📕 playbook done: ${name}`)
  elapsed.end({
    label: "🏁 playbook runned in",
    logger: ctx.require("logger"),
    logLevel: "trace",
  })
}
const report = ({ log = true }) => {
  if (!log) {
    return
  }
  const { counter } = ctx.require("playbook")
  const msg = `🚩 report: ${chalk.cyanBright(
    `Changed=${counter.changed}`
  )} ${chalk.green(`Unchanged=${counter.unchanged}`)} ${chalk.greenBright(
    `OK=${counter.unchanged + counter.changed}`
  )} ${chalk.red(`Failed=${counter.failed}`)} ${
    counter.retried > 0 ? chalk.yellow(`Retried=${counter.retried}`) : ""
  }`
  const logger = ctx.require("parentLogger")
  logger.info(msg)
}

module.exports = { start, end, report }
