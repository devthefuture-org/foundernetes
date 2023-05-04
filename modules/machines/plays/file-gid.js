const ctx = require("@foundernetes/ctx")
const { createPlay } = require("@foundernetes/blueprint")

module.exports = async () => {
  return createPlay({
    async check({ file, gid }) {
      const ssh = ctx.require("ssh")
      const { stdout } = await ssh.execCommand(`stat --format %g ${file}`)
      return stdout === gid.toString()
    },
    async run({ file, gid }) {
      const ssh = ctx.require("ssh")
      await ssh.execCommand(`chgrp ${gid} ${file}`)
    },
  })
}
