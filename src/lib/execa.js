const defaults = require("lodash.defaults")
const pick = require("lodash.pick")
const omit = require("lodash.omit")

const { execa } = require("@esm2cjs/execa")

const ctx = require("~/ctx")
const sudoFactory = require("./sudo-factory")

const f10sExecaOptions = ["sudo", "logger", "callbacks"]

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

  const { callbacks = [] } = extraOptions

  if (extraOptions.sudo) {
    const { sudo } = extraOptions
    if (sudo === true) {
      commandFunction = ctx.require("sudo")
    } else {
      commandFunction = sudoFactory({ execaOptions, ...sudo })
    }
  }

  if (extraOptions.logger) {
    let { logger } = extraOptions
    let { loggerLevel = "info" } = extraOptions
    if (execaOptions.all !== false) {
      execaOptions.all = true
    }
    if (logger === true) {
      logger = ctx.require("logger")
    } else if (typeof logger === "string") {
      loggerLevel = logger
      logger = ctx.require("logger")
    }
    const logStream = logger.getStream(loggerLevel)

    callbacks.unshift((child) => {
      if (execaOptions.all) {
        child.all.pipe(logStream)
      } else {
        child.stdout.pipe(logStream)
        child.stderr.pipe(logStream)
      }
    })
  }

  const defaultOptions = { signal }

  defaults(execaOptions, defaultOptions)

  const child = commandFunction(command, args, execaOptions)

  for (const callback of callbacks) {
    callback(child)
  }

  return child
}
