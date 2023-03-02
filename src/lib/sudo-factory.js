const os = require("os")

const { execa } = require("@esm2cjs/execa")

const ctx = require("~/ctx")

module.exports = (options = {}) => {
  const config = ctx.require("config")
  const { execaOptions: execaDefaultOptions = {} } = options
  const { password = config.sudoPassword } = options

  const { username } = os.userInfo()
  const { prompt = `[sudo] password for ${username}: ` } = options

  return (command, args = [], execaOptions = {}) => {
    const sudoArgs = ["-S", "-k", "-p", prompt, command, ...args]

    const input = `${password}\n`

    const child = execa("sudo", sudoArgs, {
      ...execaDefaultOptions,
      ...execaOptions,
      ...(input ? { input } : {}),
    })

    child.stderr.on("data", (data) => {
      const lines = data.toString().trim().split("\n")
      if (lines.some((line) => line === prompt)) {
        throw new Error("incorrect password")
      }
    })

    return child
  }
}
