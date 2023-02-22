const read = require("read")
const { execa } = require("@esm2cjs/execa")

const ctx = require("~/ctx")

module.exports = async (options = {}) => {
  const config = ctx.require("config")
  const {
    askPassword = true,
    execaOptions = {},
    prompt = "sudo requires your password: ",
  } = options
  let { password = config.sudoPassword } = options
  if (!password && askPassword) {
    password = await read({
      prompt,
      silent: true,
    })
  }

  return (command, args = []) => {
    const sudoPrompt = "#node-sudo-passwd#"
    const sudoArgs = ["-S", "-p", sudoPrompt, command, ...args]

    const input = `${password}\n`

    const child = execa("sudo", sudoArgs, {
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
