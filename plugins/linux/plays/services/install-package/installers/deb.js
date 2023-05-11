const path = require("path")

const fs = require("fs-extra")

const { createPlay, $ } = require("@foundernetes/blueprint")

const downloadFile = require("~/lib/download-file")
// const ChecksumError = require("~/errors/checksum")
const checkCmd = require("../checks/cmd")
const handleArchive = require("../handlers/archive")

module.exports = async () =>
  createPlay({
    defaultTags: ["*"],
    check: [
      checkCmd,
      async ({ name }, _extraContext, { isPostCheck }) => {
        const { stdout } = await $(`apt list --installed ${name}`, {
          logStd: isPostCheck,
        })
        return stdout.includes(`${name}/`)
      },
    ],
    runRetry: 2,
    runRetryOnError: true,
    // runRetryOnErrors: [ChecksumError],
    async run(vars, _context) {
      let { file: debFile } = vars

      let tmpDir
      if (!debFile) {
        const { download } = vars
        const { url, checksum } = download
        debFile = await downloadFile(url, null, { checksum })
        tmpDir = path.dirname(debFile)
      }

      const { name } = vars
      const { archive, extracted, checksum } = vars
      if (archive) {
        debFile = await handleArchive({
          name,
          file: debFile,
          extracted,
          checksum,
          tmpDir,
        })
      }

      const { lockWaitTimeout = 600 } = vars

      await $(
        `apt-get -qq --fix-broken install -y ${debFile} -o=DPkg::Lock::Timeout=${lockWaitTimeout} -o=Dpkg::Use-Pty=0`,
        {
          env: {
            DEBIAN_FRONTEND: "noninteractive",
          },
          sudo: true,
        }
      )

      const { clean = true } = vars
      if (clean && tmpDir) {
        await fs.remove(tmpDir)
      }

      return true
    },
  })
