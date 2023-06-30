const { createPlay, $ } = require("@foundernetes/blueprint")

module.exports = async () => {
  return createPlay(async (disk) => {
    const { mountPath, device, auto = true, extraFlags = [] } = disk
    return {
      async check() {
        const { stdout, exitCode } = await $(
          `findmnt -n -o SOURCE --target ${mountPath}`,
          {
            reject: false,
          }
        )
        if (exitCode !== 0) {
          return false
        }
        return stdout.split("\n").includes(device)
      },
      async run() {
        await $(`mkdir -p ${mountPath}`, { sudo: true })
        await $(
          `mount ${auto ? "-t auto" : ""} ${extraFlags.join(
            " "
          )} ${device} ${mountPath}`,
          { sudo: true }
        )
      },
    }
  })
}
