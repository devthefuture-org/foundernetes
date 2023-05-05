const ctx = require("@foundernetes/ctx")
const { createPlay } = require("@foundernetes/blueprint")

module.exports = async () => {
  return createPlay({
    async check(vars) {
      const ssh = ctx.require("ssh")
      const sftp = await ssh.requestSFTP()
      const { target } = vars
      return new Promise((resolve, reject) => {
        sftp.readdir(target, (err) => {
          if (err) {
            if (err.code === 2) {
              resolve(false)
            } else {
              reject(err)
            }
          } else {
            resolve(true)
          }
        })
      })
    },
    async run(vars) {
      const ssh = ctx.require("ssh")
      const { target } = vars
      const { method = "sftp" } = vars
      await ssh.mkdir(target, method)
    },
  })
}
