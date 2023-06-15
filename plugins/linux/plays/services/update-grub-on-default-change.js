const fs = require("fs-extra")
const { $ } = require("@foundernetes/blueprint")

const onFileChange = require("~/plays/std-factories/on-file-change")

module.exports = async (deps) => {
  const getDate = async () => {
    const filename = "/boot/grub/grub.cfg"
    if (!(await fs.pathExists(filename))) {
      return false
    }
    const { mtime } = await fs.stat(filename)
    return mtime
  }
  const run = async () => {
    await $(`update-grub`, {
      sudo: true,
    })
  }

  const play = { run }

  return onFileChange({
    ...deps,
    getDate,
    play,
    file: "/etc/default/grub",
  })
}
