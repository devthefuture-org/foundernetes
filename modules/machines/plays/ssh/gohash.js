const path = require("path")
const { createPlay } = require("@foundernetes/blueprint")
const ctx = require("@foundernetes/ctx")
const gohash = require("~/lib/gohash")
const gohashRemote = require("~/lib/gohash-remote")

module.exports = async () => {
  return createPlay(async () => {
    const remoteFile = ".foundernetes/machines/bin/gohash"
    const localFile = path.join(__dirname, "../../bin/gohash")
    const sum = await gohash(localFile)

    return {
      async check() {
        const ssh = ctx.require("ssh")
        const remoteSum = await gohashRemote(remoteFile, ssh)
        return remoteSum === sum
      },
      async run() {
        const logger = ctx.require("logger")
        const ssh = ctx.require("ssh")
        logger.info(`⬆️  uploading ${localFile} -> ${remoteFile} ...`)
        await ssh.putFile(localFile, remoteFile)
        await ssh.execCommand(`chmod +x ${remoteFile}`)
        logger.info(`📁 uploaded ${localFile} -> ${remoteFile}`)
      },
    }
  })
}
