const defaults = require("lodash.defaults")
const pick = require("lodash.pick")
const omit = require("lodash.omit")
const { parse } = require("shell-quote")
const { execa } = require("@esm2cjs/execa")
const chalk = require("chalk")

const ctx = require("~/ctx")

const sudoFactory = require("./sudo-factory")
const gosuFactory = require("./gosu-factory")

const f10sExecaOptions = [
  "sudo",
  "enforceLeastPrivilege",
  "enforceLeastPrivilegeUseGoSu",
  "logger",
  "callbacks",
  "logger",
  "logStd",
  "logStdOut",
  "logStdErr",
  "logCommand",
  "extendEnvFromConfig",
]

module.exports = (command, args, options) => {
  if (!Array.isArray(args)) {
    options = args || {}
    ;[command, ...args] = parse(command)
    args = args.map((arg) => {
      if (typeof arg === "object") {
        return arg.pattern || arg.op
      }
      return arg
    })
  }

  let commandFunction = execa

  const defaultExecaOptions = {
    // stripFinalNewline: true,
    // extendEnv: true,
    // stdio: "pipe",
    detached: true,
  }

  const execaOptions = {
    ...defaultExecaOptions,
    ...omit(options, f10sExecaOptions),
  }
  const extraOptions = pick(options, f10sExecaOptions)

  const signal = ctx.require("abortSignal")
  const config = ctx.require("config")

  const callbacks = [...(extraOptions.callbacks || [])]

  let { sudo } = extraOptions
  const {
    enforceLeastPrivilege = config.execEnforceLeastPrivilege,
    enforceLeastPrivilegeUseGoSu = config.execEnforceLeastPrivilegeUseGoSu,
  } = extraOptions

  if (!sudo && enforceLeastPrivilege && process.env.SUDO_USER) {
    if (enforceLeastPrivilegeUseGoSu) {
      commandFunction = gosuFactory({
        execaOptions,
        user: process.env.SUDO_USER,
        group: process.env.SUDO_USER,
      })
    } else {
      sudo = {
        user: process.env.SUDO_USER,
        group: process.env.SUDO_USER,
      }
    }
  }
  if (sudo) {
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
    logCommand = config.execLogCommands,
    defaultEnv = config.execEnv,
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

  if (!execaOptions.env) {
    execaOptions.env = {}
  }
  const { extendEnvFromConfig = true } = extraOptions
  if (extendEnvFromConfig) {
    execaOptions.env = { ...defaultEnv, ...execaOptions.env }
  }

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
