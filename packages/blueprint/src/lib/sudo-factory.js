const os = require("os")
const { randomUUID } = require("node:crypto")
const { setTimeout } = require("timers/promises")
const through2 = require("through2")
const { execa } = require("@foundernetes/execa")
const Deferred = require("@foundernetes/std/deferred")

const ctx = require("@foundernetes/ctx")
const sudoDetectPasswordNeeded = require("./sudo-detect-password-needed")

module.exports = (options = {}) => {
  const config = ctx.require("config")
  const { execaOptions: execaDefaultOptions = {} } = options
  const { password = config.sudoPassword } = options
  const { passwordNeeded: passwordNeededDefault } = options
  const {
    user,
    group,
    preserveEnv = true,
    passwordDetectNeeded = true,
    passwordLessAfterTimeout = true,
  } = options

  const { username } = os.userInfo()
  let { prompt = `[sudo][${randomUUID()}] password for ${username}: ` } =
    options
  prompt = prompt.trim()

  return (command, args = [], execaOptions = {}) => {
    const sudoArgs = [
      "-S",
      ...(preserveEnv ? ["-E"] : []),
      ...(user !== undefined ? ["-u", user] : []),
      ...(group !== undefined ? ["-g", group] : []),
      "-k",
      "-p",
      prompt,
      command,
      ...args,
    ]

    const inputPassword = `${password || ""}\n`

    execaOptions = { ...execaOptions }
    const { input } = execaOptions
    if (input) {
      delete execaOptions.input
    }

    const child = execa("sudo", sudoArgs, {
      ...execaDefaultOptions,
      ...execaOptions,
    })

    let prompted = 0
    const passwordTyped = new Deferred()
    child.stderr = child.stderr.pipe(
      through2(function (chunk, _enc, callback) {
        const lines = chunk.toString().trim().split("\n")
        if (lines.some((line) => line === prompt)) {
          if (prompted > 0) {
            throw new Error("incorrect password")
          }
          child.stdin.write(inputPassword)
          passwordTyped.resolve()
          prompted += 1
        } else {
          this.push(chunk)
        }
        callback()
      })
    )

    if (input) {
      ;(async () => {
        let passwordNeeded = passwordNeededDefault
        if (passwordNeeded === undefined) {
          if (passwordDetectNeeded) {
            passwordNeeded = await sudoDetectPasswordNeeded()
          } else {
            passwordNeeded = !!password
          }
        }
        if (passwordNeeded) {
          if (passwordLessAfterTimeout) {
            await Promise.race([passwordTyped.promise, setTimeout(2000)])
          } else {
            await passwordTyped.promise
          }
        }
        child.stdin.write(input)
        child.stdin.end()
      })()
    }

    return child
  }
}
