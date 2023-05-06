const path = require("path")

const fs = require("fs-extra")
const which = require("which")

const ctx = require("@foundernetes/ctx")
const { createPlay, $ } = require("@foundernetes/blueprint")

const downloadFile = require("~/lib/download-file")
const checksumFile = require("~/lib/checksum-file")
const ChecksumError = require("~/errors/checksum")

const handleArchive = require("../handlers/archive")

// https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options
const checksumAlgos = ["md5", "sha1", "sha256", "sha512"]

const checkCmd = require("../checks/cmd")

module.exports = async () =>
  createPlay(async (vars) => {
    const { name, dir = "/usr/local/bin" } = vars
    const file = `${dir}/${name}`

    return {
      defaultTags: ["*"],
      check: [
        checkCmd,
        async (_vars, _common, { isPostCheck }) => {
          const { ensureWhich = true } = vars
          const logger = ctx.require("logger")
          if (!(await fs.pathExists(file))) {
            return false
          }

          if (ensureWhich) {
            const binPath = await which(name)
            if (!binPath) {
              return false
            }
            if (binPath !== file) {
              logger.error(
                `which "${name}" is expected to be "${file}" but found "${binPath}"`
              )
              return false
            }
          }

          let { checksum } = vars
          if (!checksum) {
            const algo = checksumAlgos.find(
              (checksumAlgo) => !!vars[checksumAlgo]
            )
            if (algo) {
              checksum = { algo, hash: vars[algo] }
            }
          }
          if (checksum) {
            const { algo, hash } = checksum
            const digest = await checksumFile(algo, file)
            const logLevel = isPostCheck ? "error" : "debug"
            if (digest !== hash) {
              logger[logLevel](
                `checksum ${algo} was not valid: ${digest}, expected ${hash}`
              )
              return false
            }
          }
          return true
        },
      ],
      runRetry: 2,
      runRetryOnErrors: [ChecksumError],
      async run() {
        let { file: installFile } = vars

        let tmpDir
        if (!installFile) {
          const { download } = vars
          const { url, checksum } = download
          installFile = await downloadFile(url, null, { checksum })
          tmpDir = path.dirname(installFile)
        }

        const { archive, extracted, checksum } = vars
        if (archive) {
          installFile = await handleArchive({
            name,
            file: installFile,
            extracted,
            checksum,
            tmpDir,
          })
        }

        const { useInstall = true, clean = true } = vars
        if (useInstall) {
          await $(`install -T ${installFile} ${file}`, {
            sudo: true,
          })
        } else {
          await fs.chmod(installFile, 0o755)
          await $("mv", [installFile, file], {
            sudo: true,
          })
        }

        if (clean && tmpDir) {
          await fs.remove(tmpDir)
        }

        return true
      },
    }
  })
