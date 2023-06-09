const { createPlay } = require("@foundernetes/blueprint")
const ctx = require("~/ctx")

module.exports = async () => {
  return createPlay({
    async check({ file, gid }) {
      const ssh = ctx.getSSH()
      const { stdout } = await ssh.execCommand(`stat --format %g ${file}`)
      return stdout === gid.toString()
    },
    async run({ file, gid }) {
      const ssh = ctx.getSSH()
      await ssh.execCommandSudo(`sudo chgrp ${gid} ${file}`)
    },
  })
}
