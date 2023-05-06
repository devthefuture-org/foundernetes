const { createPlay } = require("@foundernetes/blueprint")
const ctx = require("~/ctx")

module.exports = async () => {
  return createPlay({
    async check({ file, mode }) {
      const ssh = ctx.getSSH()
      const { stdout } = await ssh.execCommand(`stat --format %a ${file}`)
      return stdout === mode.toString()
    },
    async run({ file, mode }) {
      const ssh = ctx.getSSH()
      await ssh.execCommand(`chmod ${mode} ${file}`)
    },
  })
}
