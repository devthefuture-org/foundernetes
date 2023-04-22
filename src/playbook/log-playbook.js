const chalk = require("chalk")
const dayjs = require("dayjs")

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
  logger.info(`📖 launching playbook: ${name}`, {
    datetime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  })
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
  const totalOk = counter.unchanged + counter.changed
  const totalPlayed = totalOk + counter.failed
  const msg = `🚩 report: ${chalk.blue(
    `Played=${totalPlayed}`
  )} ${chalk.cyanBright(`Changed=${counter.changed}`)} ${chalk.green(
    `Unchanged=${counter.unchanged}`
  )} ${chalk.greenBright(`OK=${totalOk}`)} ${chalk.red(
    `Failed=${counter.failed}`
  )} ${counter.retried > 0 ? chalk.yellow(`Retried=${counter.retried}`) : ""}`
  const logger = ctx.require("parentLogger")
  logger.info(msg, {
    datetime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  })
}

const getPlaybooksList = (playbooks) =>
  playbooks.map((playbook) => playbook.playbookName)

const startAll = (playbooks, { parallel }) => {
  if (playbooks.length <= 1) {
    return
  }
  const methodName = parallel ? "parallel" : "series"
  const logger = ctx.require("logger")
  logger.info(
    `🌍 launching all playbooks in ${methodName}: ${chalk.cyanBright(
      getPlaybooksList(playbooks).join(",")
    )}`,
    {
      datetime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    }
  )
}

const endAll = (playbooks) => {
  if (playbooks.length <= 1) {
    return
  }
  const logger = ctx.require("logger")

  const counter = {
    unchanged: 0,
    changed: 0,
    failed: 0,
    retried: 0,
    total: 0,
  }
  for (const playbook of playbooks) {
    for (const key of Object.keys(counter)) {
      counter[key] += playbook.counter[key]
    }
  }

  const totalOk = counter.unchanged + counter.changed
  const totalPlayed = totalOk + counter.failed
  const msg = `🌍 total report: ${chalk.blue(
    `Played=${totalPlayed}`
  )} ${chalk.cyanBright(`Changed=${counter.changed}`)} ${chalk.green(
    `Unchanged=${counter.unchanged}`
  )} ${chalk.greenBright(`OK=${totalOk}`)} ${chalk.red(
    `Failed=${counter.failed}`
  )} ${counter.retried > 0 ? chalk.yellow(`Retried=${counter.retried}`) : ""}`
  logger.info(msg, {
    datetime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    playbooks: getPlaybooksList(playbooks),
  })
}

module.exports = { start, end, report, startAll, endAll }
