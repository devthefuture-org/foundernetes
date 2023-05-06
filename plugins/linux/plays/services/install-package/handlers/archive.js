const { randomUUID } = require("node:crypto")

const fs = require("fs-extra")
const ctx = require("@foundernetes/ctx")
const async = require("@foundernetes/async")
const decompress = require("decompress")
const matchCondition = require("@foundernetes/match/condition")
const checksumFile = require("~/lib/checksum-file")

module.exports = async ({ name, file, extracted, checksum, tmpDir }) => {
  const config = ctx.getConfig()
  const logger = ctx.getLogger()
  if (!tmpDir) {
    tmpDir = `${config.tmpDir}/${randomUUID()}`
    await fs.ensureDir(tmpDir)
  }

  const files = await decompress(file, tmpDir)
  if (files.length === 0) {
    throw new Error("Invalid archive")
  }
  const fileNames = files.map((f) => f.path)

  let extractedTarget

  // find using specified condition
  if (extracted) {
    extractedTarget = fileNames.find((fname) =>
      matchCondition(fname, extracted)
    )
    if (!extractedTarget) {
      throw new Error(
        `Unable to find extracted file matching ${JSON.stringify(
          extracted
        )}, here is the list of files: ${JSON.stringify(fileNames)}`
      )
    }
    return `${tmpDir}/${extractedTarget}`
  }

  // find using checksum
  if (checksum) {
    const { algo, hash } = checksum
    const found = await async.detect(files, async (f) => {
      const digest = await checksumFile(algo, `${tmpDir}/${f.path}`)
      if (digest !== hash) {
        logger.error(
          `checksum ${algo} was not valid: ${digest}, expected ${hash}`
        )
      }
      return digest === hash
    })
    if (found) {
      extractedTarget = found.path
    }
  }

  // find using file with the same name as package
  if (!extractedTarget) {
    extractedTarget = fileNames.find((fname) => fname === name)
  }

  // find using first file with executable permission
  if (!extractedTarget) {
    /* eslint no-bitwise: ["error", { "allow": ["&"] }] */
    const found = files.find((f) => f.mode & fs.constants.X_OK)
    if (found) {
      extractedTarget = found.path
    }
  }

  // find using first file
  if (!extractedTarget) {
    ;[extractedTarget] = files
  }

  return `${tmpDir}/${extractedTarget}`
}
