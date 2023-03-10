const os = require("os")
const { randomUUID } = require("node:crypto")
const through2 = require("through2")

const { execa } = require("@esm2cjs/execa")

const ctx = require("~/ctx")

module.exports = (options = {}) => {
  const config = ctx.require("config")
  const { execaOptions: execaDefaultOptions = {} } = options
  const { password = config.sudoPassword } = options
  const { user, group, preserveEnv = true } = options

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

    const inputPassword = `${password}\n`

    execaOptions = { ...execaOptions }
    if (execaOptions.input) {
      execaOptions.input = `${inputPassword}${execaOptions.input}`
    }

    const child = execa("sudo", sudoArgs, {
      ...execaDefaultOptions,
      ...execaOptions,
    })

    let prompted = 0
    child.stderr = child.stderr.pipe(
      through2(function (chunk, _enc, callback) {
        const lines = chunk.toString().trim().split("\n")
        if (lines.some((line) => line === prompt)) {
          if (prompted > 0) {
            throw new Error("incorrect password")
          }
          if (!execaOptions.input) {
            child.stdin.write(inputPassword)
          }
          prompted += 1
        } else {
          this.push(chunk)
        }
        callback()
      })
    )

    return child
  }
}
