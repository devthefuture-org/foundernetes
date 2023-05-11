const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async ({ loaders }) => {
  return createPlay({
    async check() {
      const activeState = await loaders.services.serviceInfos({
        name: "getty@tty1",
        field: "ActiveState",
      })
      return activeState === "inactive"
    },
    async run() {
      await $("systemctl stop getty@tty1", { sudo: true })
    },
  })
}
