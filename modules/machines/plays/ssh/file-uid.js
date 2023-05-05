const ctx = require("@foundernetes/ctx")
const { createPlay } = require("@foundernetes/blueprint")

module.exports = async () => {
  return createPlay({
    async check({ file, uid }) {
      const ssh = ctx.require("ssh")
      const { stdout } = await ssh.execCommand(`stat --format %u ${file}`)
      return stdout === uid.toString()
    },
    async run({ file, uid }) {
      const ssh = ctx.require("ssh")
      await ssh.execCommand(`chown ${uid} ${file}`)
    },
  })
}
