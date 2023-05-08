const { createPlay } = require("@foundernetes/blueprint")
const ctx = require("~/ctx")

module.exports = async () => {
  return createPlay({
    async check(vars) {
      const ssh = ctx.getSSH()
      const { target } = vars
      return ssh.dirExists(target)
    },
    async run(vars) {
      const ssh = ctx.getSSH()
      const { target, ...options } = vars
      await ssh.mkdir(target, options)
    },
  })
}
