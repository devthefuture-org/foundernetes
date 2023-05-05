const ctx = require("@foundernetes/ctx")
const { createPlay } = require("@foundernetes/blueprint")

module.exports = async () => {
  return createPlay({
    async check({ file, mode }) {
      const ssh = ctx.require("ssh")
      const { stdout } = await ssh.execCommand(`stat --format %a ${file}`)
      return stdout === mode.toString()
    },
    async run({ file, mode }) {
      const ssh = ctx.require("ssh")
      await ssh.execCommand(`chmod ${mode} ${file}`)
    },
  })
}
