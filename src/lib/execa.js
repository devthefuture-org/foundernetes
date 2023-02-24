const defaults = require("lodash.defaults")
const pick = require("lodash.pick")
const omit = require("lodash.omit")

const { execa } = require("@esm2cjs/execa")

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

module.exports = (command, args, options) => {
  if (args && !Array.isArray(args)) {
    options = args
    args = null
  }

  let commandFunction = execa

  const execaOptions = omit(options, f10sExecaOptions)
  const extraOptions = pick(options, f10sExecaOptions)

  execaOptions.all = true

  const signal = ctx.require("abortSignal")
  const config = ctx.require("config")

  const { callbacks = [] } = extraOptions

  if (extraOptions.sudo) {
    const { sudo } = extraOptions
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

  if (logStdout || logStderr) {
    if (logStd && execaOptions.all !== false) {
      execaOptions.all = true
    }
    const logStream = logger.getStream(logStdLevel)

    callbacks.unshift((child) => {
      if (logStd && execaOptions.all) {
        child.all.pipe(logStream)
      } else {
        if (logStdout) {
          child.stdout.pipe(logStream)
        }
        if (logStderr) {
          child.stderr.pipe(logStream)
        }
      }
    })
  }

  const defaultOptions = { signal }

  defaults(execaOptions, defaultOptions)

  if (logCommand) {
    logger[logStdLevel]([command, ...args].join(" "))
  }

  const child = commandFunction(command, args, execaOptions)

  for (const callback of callbacks) {
    callback(child)
  }

  return child
}
