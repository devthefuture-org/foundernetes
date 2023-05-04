const fs = require("fs-extra")
const dayjs = require("dayjs")
const { createPlay, $ } = require("@foundernetes/blueprint")

const splitUnit = require("@foundernetes/std/split-unit")

module.exports = async () =>
  createPlay({
    runRetry: 2,
    runRetryOnError: true,
    async before(vars) {
      const { periodicity = "1d" } = vars
      return { periodicity }
    },
    async check(vars, { periodicity }) {
      const { filename = "/var/cache/apt/pkgcache.bin" } = vars
      if (!(await fs.pathExists(filename))) {
        return false
      }
      const { ctime, mtime = ctime } = await fs.stat(filename)
      return (
        mtime >
        dayjs()
          .subtract(...splitUnit(periodicity))
          .toDate()
      )
    },
    async run() {
      await $(`apt-get update`, {
        sudo: true,
      })
    },
  })
