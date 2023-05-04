const path = require("path")
const stream = require("stream")
const { promisify } = require("util")
const { randomUUID } = require("node:crypto")
const fs = require("fs-extra")

const ctx = require("@foundernetes/ctx")
const { $ } = require("@foundernetes/blueprint")

const handleAxiosError = require("@foundernetes/axios/handle-axios-error")
const axios = require("@foundernetes/axios")
const ChecksumError = require("~/errors/checksum")

const finished = promisify(stream.finished)

const checksumFile = require("./checksum-file")

module.exports = async (
  url,
  file,
  { logger = ctx.require("logger"), logEnabled = true, checksum, sudo } = {}
) => {
  const config = ctx.require("config")

  const tmpDir = `${config.tmpDir}/${randomUUID()}`
  await fs.ensureDir(tmpDir)
  const basename = path.basename(url)
  const tmpFile = `${tmpDir}/${basename}`
  const writer = fs.createWriteStream(tmpFile)
  if (logEnabled) {
    logger.debug(`🔻 downloading ${url} ...`)
  }
  try {
    const response = await axios({
      method: "get",
      url,
      responseType: "stream",
    })
    response.data.pipe(writer)
    response.data.on("error", (err) => {
      logger.error(err)
    })
    await finished(writer)
  } catch (error) {
    handleAxiosError(error, logger)
    throw error
  }
  if (checksum) {
    const { algo, hash } = checksum
    const digest = await checksumFile(algo, tmpFile)
    if (digest !== hash) {
      throw new ChecksumError(
        `checksum ${algo} was not valid: ${digest}, expected ${hash}`
      )
    }
  }
  if (file) {
    await $("mv", [tmpFile, file], {
      sudo,
    })
  } else {
    file = tmpFile
  }
  return file
}
