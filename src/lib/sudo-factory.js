const { execa } = require("@esm2cjs/execa")

const ctx = require("~/ctx")

module.exports = (options = {}) => {
  const config = ctx.require("config")
  const { execaOptions: execaDefaultOptions = {} } = options
  const { password = config.sudoPassword } = options

  return (command, args = [], execaOptions = {}) => {
    const sudoPrompt = "#node-sudo-passwd#"
    const sudoArgs = ["-S", "-p", sudoPrompt, command, ...args]

    const input = `${password}\n`

    const child = execa("sudo", sudoArgs, {
      ...execaDefaultOptions,
      ...execaOptions,
      ...(input ? { input } : {}),
    })

    let prompts = 0
    child.stderr.on("data", (data) => {
      const lines = data.toString().trim().split("\n")
      lines.forEach((line) => {
        if (line === sudoPrompt) {
          if (++prompts > 1) {
            throw new Error("incorrect password")
          }
        }
      })
    })

    return child
  }
}
