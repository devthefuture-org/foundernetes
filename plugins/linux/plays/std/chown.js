const fs = require("fs-extra")

const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async () =>
  createPlay({
    defaultTags: ["*"],
    async check(vars) {
      const { uid, gid } = vars
      const { file } = vars
      const stat = await fs.stat(file)
      if (stat.uid.toString() !== uid) {
        return false
      }
      if (stat.gid.toString() !== gid) {
        return false
      }
      return true
    },
    async run(vars) {
      const { file, uid, gid, sudo = true } = vars
      await $(`chown ${uid}:${gid} ${file}`, {
        sudo,
      })
    },
  })
