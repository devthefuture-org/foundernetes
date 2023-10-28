const fs = require("fs-extra")
const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async () =>
  createPlay({
    defaultTags: ["*"],
    check: async ({ name }) => {
      return fs.pathExists(`/sys/module/${name}`)
    },
    async run({ name }) {
      await $(`modprobe ${name}`, { sudo: true })
      return true
    },
  })
