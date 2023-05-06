const path = require("path")
const fs = require("fs-extra")
const tmp = require("tmp")
const defaults = require("lodash/defaults")

const ctx = require("@foundernetes/ctx")
const { createPlay } = require("@foundernetes/blueprint")

const gohash = require("~/lib/gohash")
const gohashRemote = require("~/lib/gohash-remote")

module.exports = async () => {
  return createPlay(async (vars) => {
    let { source } = vars
    const { content } = vars
    if (content) {
      const tmpFile = await tmp.file()
      await fs.writeFile(tmpFile, content)
      source = tmpFile
    } else {
      source = path.resolve(source)
    }
    const checksum = await gohash(source)

    return {
      async check() {
        const { target } = vars
        const remoteSum = await gohashRemote(target)
        return remoteSum === checksum
      },
      async run() {
        const logger = ctx.require("logger")
        const ssh = ctx.require("ssh")
        const { target } = vars

        logger.info(`⬆️  uploading ${source} -> ${target} ...`)
        const uploadOptions = defaults(
          { ...vars.uploadOptions },
          {
            recursive: true,
            concurrency: 1, // WARNING: Not all servers support high concurrency
            stream: "both",
            options: { pty: true },
            tick(localPath, remotePath, error) {
              if (error) {
                logger.warn(`failed transfer ${localPath} -> ${remotePath}`)
              } else {
                logger.debug(
                  `successful transfer ${localPath} -> ${remotePath}`
                )
              }
            },
          }
        )

        await ssh.putFile(source, target, null, uploadOptions, {
          step: (totalTransferred, _chunk, total) => {
            logger.debug(`uploaded ${totalTransferred} of ${total}`)
          },
        })
        logger.info(`📁 uploaded ${source} -> ${target}`)
      },
    }
  })
}
