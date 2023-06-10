const path = require("path")
const fs = require("fs-extra")
const { createPlay, ctx, $ } = require("@foundernetes/blueprint")

module.exports = async () => {
  const config = ctx.getConfig()
  const checkFile = path.join(config.factsPath, "setterm-blank")
  return createPlay({
    async check() {
      return (
        (await fs.pathExists(checkFile)) &&
        (await fs.readFile(checkFile, "utf-8")) === "1"
      )
    },
    async run() {
      await $('su - -c "setterm --blank force --term linux </dev/tty1"', {
        sudo: true,
      })
      await fs.writeFile(checkFile, "1", "utf-8")
    },
  })
}
