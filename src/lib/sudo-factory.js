const { execa } = require("@esm2cjs/execa")

const ctx = require("~/ctx")

module.exports = (options = {}) => {
  const config = ctx.require("config")
  const { execaOptions: execaDefaultOptions = {} } = options
  const { password = config.sudoPassword } = options

  return (command, args = [], execaOptions = {}) => {
    const sudoArgs = ["-S", "-p", "", command, ...args]

    const input = `${password}\n`

    const child = execa("sudo", sudoArgs, {
      ...execaDefaultOptions,
      ...execaOptions,
      ...(input ? { input } : {}),
    })

    let prompts = 0
    child.stderr.on("data", (data) => {
      const lines = data.toString().trim().split("\n")
      prompts += lines.length
      if (prompts > 1) {
        throw new Error("incorrect password")
      }
    })

    return child
  }
}
