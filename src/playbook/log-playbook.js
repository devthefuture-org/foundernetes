const chalk = require("chalk")

const ctx = require("~/ctx")

const getContextLoggerOptions = require("~/log/get-context-logger-options")
const setIndentationContext = require("~/log/set-context-indentation")

const start = ({ log = true, name }) => {
  ctx.set("parentLogger", ctx.require("logger"))
  if (!log) {
    return
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
}

const end = ({ log = true, name }) => {
  if (!log) {
    return false
  }
  const logger = ctx.require("parentLogger")
  logger.info(`📕 playbook done: ${name}`)
}
const report = ({ log = true }) => {
  if (!log) {
    return
  }
  const { counter } = ctx.require("playbook")
  const msg = `🚩 report: ${chalk.green(`OK=${counter.ok}`)} ${chalk.cyanBright(
    `Changed=${counter.changed}`
  )} ${chalk.red(`Failed=${counter.failed}`)} ${
    counter.retried > 0 ? chalk.yellow(`Retried=${counter.retried}`) : ""
  }`
  const logger = ctx.require("parentLogger")
  logger.info(msg)
}

module.exports = { start, end, report }
