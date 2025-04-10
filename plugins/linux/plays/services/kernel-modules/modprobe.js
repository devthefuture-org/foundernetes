const fs = require("fs-extra")
const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async () =>
  createPlay({
    defaultTags: ["*"],
    check: async ({ name }) => {
      if (await fs.pathExists(`/sys/module/${name}`)) {
        return true
      }
      if (await fs.pathExists(`/sys/module/${name.replaceAll("-", "_")}`)) {
        return true
      }
      return false
    },
    async run({ name }) {
      await $(`modprobe ${name}`, { sudo: true })
      return true
    },
  })
