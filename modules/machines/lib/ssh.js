const { randomUUID } = require("node:crypto")
const { PassThrough } = require("stream")
const { setTimeout } = require("timers/promises")

const shellQuote = require("shell-quote")
const untildify = require("untildify")
const { NodeSSH } = require("node-ssh")
const Deferred = require("@foundernetes/std/deferred")

const sshSudoDetectPasswordNeeded = require("./ssh-sudo-detect-password-needed")

module.exports = async (options = {}) => {
  const ssh = new NodeSSH()
  const {
    address,
    user,
    port,
    password,
    tryKeyboard = true,
    sudoPassword = password,
    sudoPasswordNeeded: sudoPasswordNeededDefault,
    sudoPasswordDetectNeeded: sudoPasswordDetectNeededDefault = true,
    sudoPasswordLessAfterTimeout: sudoPasswordLessAfterTimeoutDefault = true,
  } = options

  let { keyPath } = options
  if (keyPath) {
    keyPath = untildify(keyPath)
  }

  let sudoPrompt = `[sudo][${randomUUID()}] password: `
  sudoPrompt = sudoPrompt.trim()

  await ssh.connect({
    host: address,
    username: user,
    port,
    privateKeyPath: keyPath,
    password,
    tryKeyboard,
  })

  ssh.execCommandSudo = async (command, opts = {}) => {
    const {
      preserveEnv,
      user: impersonateUser,
      group: impersonateGroup,
      sudoPassword: sudoPasswordLocal = sudoPassword,
      sudoPasswordNeeded = sudoPasswordNeededDefault,
      sudoPasswordDetectNeeded = sudoPasswordDetectNeededDefault,
      sudoPasswordLessAfterTimeout = sudoPasswordLessAfterTimeoutDefault,
      ...commandOptions
    } = opts

    if (!Array.isArray(command)) {
      command = shellQuote.parse(command)
    }

    command = [
      ...command.splice(0, 1),
      "-S",
      ...(preserveEnv ? ["-E"] : []),
      ...(impersonateUser !== undefined ? ["-u", impersonateUser] : []),
      ...(impersonateGroup !== undefined ? ["-g", impersonateGroup] : []),
      "-k",
      "-p",
      sudoPrompt,
      ...command,
    ]
    command = shellQuote.quote(command)

    const stdin = new PassThrough()

    let prompted = 0
    const passwordTyped = new Deferred()

    const promise = ssh.execCommand(command, {
      ...commandOptions,
      onStderr: (chunk) => {
        const lines = chunk.toString().trim().split("\n")
        if (lines.some((line) => line === sudoPrompt)) {
          if (prompted > 0) {
            throw new Error("incorrect password")
          }
          prompted += 1
          stdin.write(`${sudoPasswordLocal}\n`)
          passwordTyped.resolve()
        }
      },
      stdin,
    })

    let passwordNeeded = sudoPasswordNeeded
    if (passwordNeeded === undefined) {
      if (sudoPasswordDetectNeeded) {
        passwordNeeded = await sshSudoDetectPasswordNeeded(ssh)
      } else {
        passwordNeeded = !!sudoPasswordLocal
      }
    }
    if (passwordNeeded) {
      if (sudoPasswordLessAfterTimeout) {
        await Promise.race([passwordTyped.promise, setTimeout(2000)])
      } else {
        await passwordTyped.promise
      }
    }
    if (commandOptions.stdin) {
      if (typeof commandOptions.stdin === "string") {
        stdin.write(commandOptions.stdin)
        stdin.end()
      } else {
        commandOptions.stdin.pipe(stdin)
      }
    }

    return promise
  }

  return ssh
}
