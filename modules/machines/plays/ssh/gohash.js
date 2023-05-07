const { createPlay } = require("@foundernetes/blueprint")
const which = require("which")
const ctx = require("~/ctx")
const gohash = require("~/lib/gohash")
const gohashRemote = require("~/lib/gohash-remote")

module.exports = async () => {
  return createPlay(async () => {
    const remoteFile = ".foundernetes/machines/bin/gohash"
    const localFile = await which("gohash")
    const sum = await gohash(localFile)

    return {
      async check() {
        const ssh = ctx.getSSH()
        const remoteSum = await gohashRemote(remoteFile, ssh)
        return remoteSum === sum
      },
      async run() {
        const logger = ctx.getLogger()
        const ssh = ctx.getSSH()
        logger.info(`⬆️  uploading ${localFile} -> ${remoteFile} ...`)
        await ssh.putFile(localFile, remoteFile)
        await ssh.execCommand(`chmod +x ${remoteFile}`)
        logger.info(`📁 uploaded ${localFile} -> ${remoteFile}`)
      },
    }
  })
}
