const fs = require("fs-extra")
const { $ } = require("@foundernetes/blueprint")

const onFileChange = require("~/plays/std-factories/on-file-change")

module.exports = async (deps) => {
  const getDate = async (vars) => {
    const { filename = "/var/cache/apt/pkgcache.bin" } = vars
    if (!(await fs.pathExists(filename))) {
      return false
    }
    const { ctime, mtime = ctime } = await fs.stat(filename)
    return mtime
  }
  const run = async () => {
    await $(`apt-get update`, {
      sudo: true,
    })
  }

  const play = { run }

  return onFileChange({
    ...deps,
    getDate,
    play,
    file: ["/etc/apt/sources.list", "/etc/apt/sources.list.d"],
  })
}
