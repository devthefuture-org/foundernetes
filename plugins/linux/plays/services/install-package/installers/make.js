const fs = require("fs-extra")

const { createPlay, $ } = require("@foundernetes/blueprint")

const downloadFile = require("~/lib/download-file")
// const ChecksumError = require("~/errors/checksum")

const handleArchive = require("../handlers/archive")

module.exports = async () =>
  createPlay({
    defaultTags: ["*"],
    async preCheck() {
      return false
    },
    async postCheck() {
      return true
    },
    runRetry: 2,
    // runRetryOnErrors: [ChecksumError],
    runRetryOnError: true,
    async run(vars) {
      let { makeDir, file } = vars

      if (!makeDir && !file) {
        const { download } = vars
        const { url, checksum } = download
        file = await downloadFile(url, null, { checksum })
      }

      const { name } = vars
      const { archive, extracted } = vars
      if (archive) {
        makeDir = await handleArchive({
          name,
          file,
          extracted,
        })
      }

      const { clean = true } = vars
      if (await fs.pathExists(`${makeDir}/configure`)) {
        await $(`./configure`, { cwd: makeDir })
      }
      await $("make", { cwd: makeDir })
      await $("checkinstall", { cwd: makeDir })

      if (clean) {
        await fs.remove(makeDir)
      }

      return true
    },
  })
