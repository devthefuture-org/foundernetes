const { createPlay } = require("@foundernetes/blueprint")
const ctx = require("~/ctx")

module.exports = async () => {
  return createPlay({
    async check({ file, uid }) {
      const ssh = ctx.getSSH()
      const { stdout } = await ssh.execCommand(`stat --format %u ${file}`)
      return stdout === uid.toString()
    },
    async run({ file, uid }) {
      const ssh = ctx.getSSH()
      await ssh.execCommand(`chown ${uid} ${file}`)
    },
  })
}
