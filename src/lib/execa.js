const defaults = require("lodash.defaults")
const pick = require("lodash.pick")
const omit = require("lodash.omit")
const { parse } = require("shell-quote")
const { execa } = require("@esm2cjs/execa")
const chalk = require("chalk")

const ctx = require("~/ctx")

const sudoFactory = require("./sudo-factory")

const f10sExecaOptions = [
  "sudo",
  "logger",
  "callbacks",
  "logger",
  "logStd",
  "logStdOut",
  "logStdErr",
  "logCommand",
]

module.exports = async (command, args, options) => {
  if (!Array.isArray(args)) {
    options = args || {}
    ;[command, ...args] = parse(command)
  }

  let commandFunction = execa

  const defaultExecaOptions = {}

  const execaOptions = {
    ...defaultExecaOptions,
    ...omit(options, f10sExecaOptions),
  }
  const extraOptions = pick(options, f10sExecaOptions)

  const signal = ctx.require("abortSignal")
  const config = ctx.require("config")

  const callbacks = [...(extraOptions.callbacks || [])]

  const { sudo } = extraOptions

  if (extraOptions.sudo) {
    if (sudo === true) {
      commandFunction = ctx.require("sudo")
    } else {
      commandFunction = sudoFactory({ execaOptions, ...sudo })
    }
  }

  const {
    logger = ctx.require("logger"),
    logStd = config.logStd,
    logStdout = logStd,
    logStderr = logStd,
    logStdLevel = "info",
    logCommand = config.logCommands,
  } = extraOptions

  const prefix = `${logger.getPrefix()} ${chalk.grey(sudo ? "#" : "$")} `
  const log = logger.child({})
  log.setPrefix(prefix)

  if (logStdout || logStderr) {
    const logStream = log.createStream({ level: logStdLevel })

    callbacks.unshift((child) => {
      if (logStdout) {
        child.stdout.pipe(logStream)
      }
      if (logStderr) {
        child.stderr.pipe(logStream)
      }
    })
  }

  const defaultOptions = { signal }

  defaults(execaOptions, defaultOptions)

  if (logCommand) {
    log[logStdLevel]([command, ...args].join(" "))
  }
  log.setPrefix(`${prefix}${chalk.grey("-")} `)

  const child = commandFunction(command, args, execaOptions)

  for (const callback of callbacks) {
    callback(child)
  }

  return child
}
